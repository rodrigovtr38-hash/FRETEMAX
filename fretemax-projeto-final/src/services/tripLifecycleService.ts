// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: FASE 4 - Centralização Atômica da Fonte da Verdade (Revisão Contratual).
// 
// [CONTRATO EXPLÍCITO DO SERVIÇO]
// ESTE SERVIÇO DELEGA E ALTERA EXCLUSIVAMENTE:
// - status (Máquina de Estados)
// - runtime (Sincronização de UI)
// - paradaAtualIndex
// - atualizadoEm
//
// CONTRATO ABERTO PARA O DISPATCH QUEUE SERVICE:
// - dispatchStatus, dispatchIndex, dispatchTentativa, filaTotal, motoristaAtualDestaque, motoristaAtualNome
// 
// CONTRATO ABERTO PARA O MOTORISTA (Apenas no ato do ACEITE):
// - motoristaId, motoristaNome, motoristaZap
//
// PROIBIÇÃO ABSOLUTA:
// Valores financeiros, distâncias, pesos, coordenadas e timestamps de criação são ignorados.
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
  status?: AppTripState;
  driverState?: DriverState;
  paradaAtualIndex?: number;
  paradas?: unknown[];
  motoristaId?: string | null;
  motoristaNome?: string | null;
  motoristaZap?: string | null;
  motoristaAtualDestaque?: string | null;
  dispatchStatus?: string;
  [key: string]: unknown;
}

export interface TripStateTransitionContract {
  // Dados de Despacho (Exclusivos para fila e orquestração)
  dispatchStatus?: string;
  dispatchIndex?: number;
  dispatchTentativa?: number;
  filaTotal?: number;
  motoristaAtualDestaque?: string | null;
  
  // Dados de Vinculação (Apenas lidos quando o status transiciona para ACEITO)
  motoristaId?: string | null;
  motoristaNome?: string | null;
  motoristaZap?: string | null;

  // Flags Comportamentais
  isRecusa?: boolean;
}

export class TripLifecycleService {
  private static inflight = new Set<string>();

  private static acquire(key: string): boolean {
    if (this.inflight.has(key)) return false;
    this.inflight.add(key);
    return true;
  }

  private static release(key: string): void {
    this.inflight.delete(key);
  }

  private static async registrarEventoDeIA(freteId: string, novoStatus: AppTripState, contract?: TripStateTransitionContract) {
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
           if (contract?.isRecusa) {
             mensagemLog = "⚠️ [Torre Operacional]: Operação abortada/recusada. Carga devolvida ao Radar.";
           }
           break;
        case AppTripState.SEM_MOTORISTA:
           mensagemLog = "⚠️ [Torre Operacional]: Tempo limite do Radar excedido. Nenhum motorista disponível.";
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

  static async alterarStatusViagem(freteId: string, novoStatus: AppTripState, contract?: TripStateTransitionContract): Promise<boolean> {
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

        // Válvula de Exceção engloba agora os status operacionais da fila de despacho
        const isForcedReset = novoStatus === AppTripState.DISPONIVEL && 
          [
            AppTripState.ACEITO, 
            AppTripState.INDO_COLETA, 
            AppTripState.CHEGOU_COLETA, 
            AppTripState.COLETANDO, 
            AppTripState.EM_TRANSPORTE, 
            AppTripState.SEM_MOTORISTA, 
            AppTripState.EXPIRADO,
            AppTripState.OFERTANDO,
            AppTripState.AGUARDANDO_ACEITE
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
        
        if (novoStatus === AppTripState.ENTREGUE && paradaAtualIndex + 1 < totalParadas) {
          paradaAtualIndex += 1;
          statusCalculado = AppTripState.EM_TRANSPORTE; 
        }

        // Montagem do Payload Seguro baseado em Contrato Explícito
        const payloadUpdate: Partial<TripDocumentData> = {
          status: statusCalculado,
          paradaAtualIndex,
          runtime,
          atualizadoEm: serverTimestamp() as unknown,
        };

        if (contract) {
          // Permissões do Fila de Despacho
          if (contract.dispatchStatus !== undefined) payloadUpdate.dispatchStatus = contract.dispatchStatus;
          if (contract.dispatchIndex !== undefined) payloadUpdate.dispatchIndex = contract.dispatchIndex;
          if (contract.dispatchTentativa !== undefined) payloadUpdate.dispatchTentativa = contract.dispatchTentativa;
          if (contract.filaTotal !== undefined) payloadUpdate.filaTotal = contract.filaTotal;
          if (contract.motoristaAtualDestaque !== undefined) payloadUpdate.motoristaAtualDestaque = contract.motoristaAtualDestaque;
          
          // Permissões de Vinculação Exclusivas ao Estado ACEITO
          if (novoStatus === AppTripState.ACEITO) {
             if (contract.motoristaId !== undefined) payloadUpdate.motoristaId = contract.motoristaId;
             if (contract.motoristaNome !== undefined) payloadUpdate.motoristaNome = contract.motoristaNome;
             if (contract.motoristaZap !== undefined) payloadUpdate.motoristaZap = contract.motoristaZap;
          }
        }

        // Regra de Limpeza de Autoria (Destituição de Carga)
        if (isForcedReset) {
          payloadUpdate.motoristaId = null;
          payloadUpdate.motoristaNome = null;
          payloadUpdate.motoristaZap = null;
          payloadUpdate.motoristaAtualDestaque = null;
        }

        transaction.update(freteRef, payloadUpdate as { [x: string]: any });

        // Gera o estado final espelhado da transação
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

      await this.registrarEventoDeIA(freteId, statusCalculado as AppTripState, contract);

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
   * Não reescreve lógicas de fila. Delega atômicamente ao ciclo de vida e seu pós-hook de Fila.
   */
  static async executarRedispatch(frete: FretePayload): Promise<void> {
    try {
      await this.alterarStatusViagem(frete.id, AppTripState.DISPONIVEL, { isRecusa: true });
    } catch (error: unknown) {
      console.error('[CTO-Log] REDISPATCH_ERROR', error);
    }
  }
}

export default TripLifecycleService;
