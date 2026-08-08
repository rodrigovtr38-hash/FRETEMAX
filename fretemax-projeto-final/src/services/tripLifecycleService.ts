// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: FASE 4 - Revisão Técnica da Reconstrução (Etapa 1).
// 
// [CONTRATO ESTRITO DO SERVIÇO]
// ESTE SERVIÇO PODE ALTERAR APENAS:
// - status (da corrida)
// - runtime (matriz de sincronização visual)
// - paradaAtualIndex
// - motoristaId, motoristaNome, motoristaZap, motoristaAtualDestaque (Apenas para remoção em Forcet Reset)
// - atualizadoEm
//
// ESTE SERVIÇO NUNCA PODE ALTERAR (Protegido via Filtro de Payload):
// - distancia (todas as variantes)
// - peso, volumes, tipoMaterial
// - valores financeiros (valorTotal, lucroPlataforma, valorMotorista, etc)
// - dados de origem e destino (lat, lng, endereços)
// - clienteId, empresaId, IDs estruturais
// - dispatchStatus, dispatchIndex, dispatchTentativa (Pertencem ao DispatchQueueService)
// - createdAt, criadoEm
// =========================================================

import { doc, serverTimestamp, collection, addDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { AppTripState, canTransition } from '../state/tripStateMachine';
import { DriverState } from '../state/driverStateMachine';
import { StateSynchronizationService } from './stateSynchronizationService';
import type { FretePayload } from './matchingEngine';
import { dispatchQueueService } from './dispatchQueueService';
import { ftiRadar } from '../core/ai/events/ia.events';

export interface TripDocumentData {
  id?: string;
  status?: AppTripState | string;
  driverState?: DriverState | string;
  paradaAtualIndex?: number;
  paradas?: unknown[];
  motoristaId?: string | null;
  motoristaNome?: string | null;
  motoristaZap?: string | null;
  motoristaAtualDestaque?: string | null;
  dispatchStatus?: string;
  [key: string]: unknown;
}

export class TripLifecycleService {
  // Lock de Memória mantido apenas para Debouncing visual da UI (evitar duplo clique cego).
  // A segurança real de concorrência agora pertence estritamente ao Firestore Transaction.
  private static inflight = new Set<string>();

  private static acquire(key: string): boolean {
    if (this.inflight.has(key)) return false;
    this.inflight.add(key);
    return true;
  }

  private static release(key: string): void {
    this.inflight.delete(key);
  }

  // Cria um registro na coleção de Chat sempre que o status operacional evolui.
  private static async registrarEventoDeIA(freteId: string, novoStatus: AppTripState, extras?: Record<string, unknown>) {
    try {
      const messagesRef = collection(db, 'fretes', freteId, 'chat');
      let mensagemLog = '';

      switch (novoStatus) {
        case AppTripState.ACEITO:
          mensagemLog = "🔔 [Torre Operacional]: Vinculação confirmada. Motorista designado para a operação.";
          break;
        case AppTripState.INDO_COLETA:
          mensagemLog = "🚚 [Torre Operacional]: Deslocamento iniciado. Motorista a caminho do Ponto de Coleta.";
          break;
        case AppTripState.CHEGOU_COLETA:
          mensagemLog = "📍 [Torre Operacional]: Alerta Geográfico. Motorista reportou chegada ao local de coleta.";
          break;
        case AppTripState.COLETANDO:
          mensagemLog = "📦 [Torre Operacional]: Veículo em fase de carregamento na doca.";
          break;
        case AppTripState.EM_TRANSPORTE:
          mensagemLog = "✅ [Torre Operacional]: Coleta finalizada (PIN validado). Motorista a caminho do Destino Final.";
          break;
        case AppTripState.ENTREGUE:
          mensagemLog = "🏁 [Torre Operacional]: Rota Finalizada com Sucesso! Valores liberados pelo sistema Escrow.";
          break;
        case AppTripState.DISPONIVEL:
           if (extras?.isRecusa) {
             mensagemLog = "⚠️ [Torre Operacional]: Motorista reportou problema e abortou operação. Carga devolvida ao Radar (Prioridade Alta).";
           }
           break;
        default:
          return; 
      }

      if (mensagemLog) {
        await addDoc(messagesRef, {
          texto: mensagemLog,
          nome: 'Torre de Controle (IA)',
          tipoUsuario: 'admin',
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("[CTO-Log] Falha ao injetar log da IA no chat:", e);
    }
  }

  /**
   * Único ponto de entrada autorizado pela arquitetura para mudar o status de uma viagem.
   * Totalmente protegido por Transação Atômica no Firestore e Payload Shielding.
   */
  static async alterarStatusViagem(freteId: string, novoStatus: AppTripState, extras: Record<string, unknown> = {}): Promise<boolean> {
    const lockKey = `trip-${freteId}-${novoStatus}`;

    if (!this.acquire(lockKey)) return false;

    try {
      const freteRef = doc(db, 'fretes', freteId);
      
      let statusCalculado = novoStatus;
      let wasForcedReset = false;
      let finalDocumentState: TripDocumentData | null = null;

      // =======================================================
      // THE SINGLE SOURCE OF TRUTH: TRANSAÇÃO ATÔMICA
      // =======================================================
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(freteRef);

        if (!snapshot.exists()) {
          throw new Error("FRETE_NAO_ENCONTRADO");
        }

        const data = snapshot.data() as TripDocumentData;

        // Válvula de Exceção para Cancelamentos, Repasses e Abortos
        const isForcedReset = novoStatus === AppTripState.DISPONIVEL && 
          [
            AppTripState.ACEITO, 
            AppTripState.INDO_COLETA, 
            AppTripState.CHEGOU_COLETA, 
            AppTripState.COLETANDO, 
            AppTripState.EM_TRANSPORTE, 
            AppTripState.SEM_MOTORISTA, 
            AppTripState.EXPIRADO
          ].includes(data.status as AppTripState);

        wasForcedReset = isForcedReset;
        
        const permitido = canTransition(data.status as AppTripState, novoStatus);
        if (!permitido && !isForcedReset) {
          throw new Error(`TRANSICAO_BLOQUEADA: De ${data.status} para ${novoStatus}`);
        }

        const runtime = StateSynchronizationService.synchronize(
          (data.driverState as DriverState) || DriverState.ONLINE,
          novoStatus
        );

        let paradaAtualIndex = (data.paradaAtualIndex as number) || 0;
        const totalParadas = data.paradas && Array.isArray(data.paradas) ? data.paradas.length : 1;

        statusCalculado = runtime.tripState;
        
        // Regra Intrínseca: Múltiplas Entregas
        if (novoStatus === AppTripState.ENTREGUE && paradaAtualIndex + 1 < totalParadas) {
          paradaAtualIndex += 1;
          statusCalculado = AppTripState.EM_TRANSPORTE; 
        }

        // =======================================================
        // PAYLOAD SHIELDING (Proteção contra injeção externa)
        // =======================================================
        const FORBIDDEN_EXTRAS = [
          'status', 'runtime', 'motoristaId', 'motoristaNome', 'motoristaZap', 
          'motoristaAtualDestaque', 'dispatchStatus', 'dispatchIndex', 
          'dispatchTentativa', 'createdAt', 'criadoEm', 'atualizadoEm', 
          'paradaAtualIndex', 'distancia', 'peso', 'valorTotal', 'valorMotorista',
          'valorLiquidoMotorista', 'lucroPlataforma', 'distanciaRealKm', 'distanciaTarifada'
        ];

        const safeExtras = Object.keys(extras).reduce((acc, key) => {
          if (!FORBIDDEN_EXTRAS.includes(key)) {
            acc[key] = extras[key];
          }
          return acc;
        }, {} as Record<string, unknown>);

        // Montagem do Payload Seguro da Transação
        const payloadUpdate: Record<string, unknown> = {
          status: statusCalculado,
          paradaAtualIndex,
          runtime,
          atualizadoEm: serverTimestamp(),
          ...safeExtras,
        };

        // Regra de Limpeza de Autoria (Destituição de Carga)
        if (isForcedReset) {
          payloadUpdate.motoristaId = null;
          payloadUpdate.motoristaNome = null;
          payloadUpdate.motoristaZap = null;
          payloadUpdate.motoristaAtualDestaque = null;
        }

        transaction.update(freteRef, payloadUpdate);

        // Gera o estado final espelhado da transação para uso em memória pós-commit
        finalDocumentState = {
          ...data,
          ...payloadUpdate,
          id: freteId
        } as TripDocumentData;
      });

      // =======================================================
      // POST-TRANSACTION HOOKS (Efeitos Colaterais Seguros)
      // Executados APENAS se a transação atômica teve sucesso absoluto
      // =======================================================
      
      if (!finalDocumentState) return false;

      await this.registrarEventoDeIA(freteId, statusCalculado as AppTripState, { isRecusa: wasForcedReset });

      // Cast restrito para o despachante de fila e eventos
      const freightPayloadToBroadcast = { ...finalDocumentState } as unknown as FretePayload;
      
      if (statusCalculado === AppTripState.DISPONIVEL && wasForcedReset) {
         ftiRadar.dispatch({ userId: 'system', eventType: 'DRIVER_CANCELED', data: freightPayloadToBroadcast, timestamp: new Date().toISOString() });
      }
      if (statusCalculado === AppTripState.EM_TRANSPORTE) {
         ftiRadar.dispatch({ userId: finalDocumentState.motoristaId || 'unknown', eventType: 'TRIP_STARTED', data: freightPayloadToBroadcast, timestamp: new Date().toISOString() });
      }
      if (statusCalculado === AppTripState.ENTREGUE) {
         ftiRadar.dispatch({ userId: finalDocumentState.motoristaId || 'unknown', eventType: 'TRIP_COMPLETED', data: freightPayloadToBroadcast, timestamp: new Date().toISOString() });
      }

      // Delegação de Orquestração: Religando o motor de despacho
      if (statusCalculado === AppTripState.DISPONIVEL && finalDocumentState.dispatchStatus !== 'aberto_no_feed') {
        try {
          dispatchQueueService.iniciarFila(freightPayloadToBroadcast).catch((err: unknown) => 
            console.error('[CTO-Log] AUTO_DISPATCH_ERROR', err)
          );
        } catch (dispatchError: unknown) {
          console.error('[CTO-Log] Falha ao iniciar auto-dispatch:', dispatchError);
        }
      }

      return true;

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn(`[CTO-Log] REJEICAO DE TRANSICAO: ${error.message}`);
      }
      return false;
    } finally {
      this.release(lockKey);
    }
  }

  /**
   * Acionado para forçar o reinício da distribuição de uma carga paralisada.
   * Não reescreve lógicas de fila. Delega atômicamente ao ciclo de vida.
   */
  static async executarRedispatch(frete: FretePayload): Promise<void> {
    try {
      // Força a entrada da corrida em "DISPONIVEL" com a flag de Recusa.
      // A transação limpará o motorista e o Post-Hook reengatilhará o DispatchQueue.
      // Elimina qualquer Race Condition ou Dupla Escrita.
      await this.alterarStatusViagem(frete.id, AppTripState.DISPONIVEL, { isRecusa: true });
    } catch (error: unknown) {
      console.error('[CTO-Log] REDISPATCH_ERROR', error);
    }
  }
}

export default TripLifecycleService;
