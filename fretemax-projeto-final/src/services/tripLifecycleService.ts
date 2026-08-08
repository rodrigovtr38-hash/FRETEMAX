// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: FASE 4 - Correção de Build (Vercel).
// Status: Importação do DispatchQueueService ajustada (Maiúscula vs Minúscula)
// para alinhar com os métodos estáticos do serviço de despacho.
// =========================================================

import { doc, serverTimestamp, collection, addDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { AppTripState, canTransition } from '../state/tripStateMachine';
import { DriverState } from '../state/driverStateMachine';
import { StateSynchronizationService } from './stateSynchronizationService';
import type { FretePayload } from './matchingEngine';
import { DispatchQueueService } from './dispatchQueueService'; // 🔥 FIX: 'D' Maiúsculo importado
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
  dispatchStatus?: string;
  dispatchIndex?: number;
  dispatchTentativa?: number;
  filaTotal?: number;
  motoristaAtualDestaque?: string | null;
  motoristaId?: string | null;
  motoristaNome?: string | null;
  motoristaZap?: string | null;
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

      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(freteRef);

        if (!snapshot.exists()) {
          throw new Error("FRETE_NAO_ENCONTRADO");
        }

        const data = snapshot.data() as TripDocumentData;

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

        const payloadUpdate: Partial<TripDocumentData> = {
          status: statusCalculado,
          paradaAtualIndex,
          runtime,
          atualizadoEm: serverTimestamp() as unknown,
        };

        if (contract) {
          if (contract.dispatchStatus !== undefined) payloadUpdate.dispatchStatus = contract.dispatchStatus;
          if (contract.dispatchIndex !== undefined) payloadUpdate.dispatchIndex = contract.dispatchIndex;
          if (contract.dispatchTentativa !== undefined) payloadUpdate.dispatchTentativa = contract.dispatchTentativa;
          if (contract.filaTotal !== undefined) payloadUpdate.filaTotal = contract.filaTotal;
          if (contract.motoristaAtualDestaque !== undefined) payloadUpdate.motoristaAtualDestaque = contract.motoristaAtualDestaque;
          
          if (novoStatus === AppTripState.ACEITO) {
             if (contract.motoristaId !== undefined) payloadUpdate.motoristaId = contract.motoristaId;
             if (contract.motoristaNome !== undefined) payloadUpdate.motoristaNome = contract.motoristaNome;
             if (contract.motoristaZap !== undefined) payloadUpdate.motoristaZap = contract.motoristaZap;
          }
        }

        if (isForcedReset) {
          payloadUpdate.motoristaId = null;
          payloadUpdate.motoristaNome = null;
          payloadUpdate.motoristaZap = null;
          payloadUpdate.motoristaAtualDestaque = null;
        }

        transaction.update(freteRef, payloadUpdate as { [x: string]: any });

        finalDocumentState = {
          ...data,
          ...payloadUpdate,
          id: freteId
        } as TripDocumentData;
      });

      if (!finalDocumentState) return false;

      await this.registrarEventoDeIA(freteId, statusCalculado as AppTripState, contract);

      const freightPayloadToBroadcast = { ...finalDocumentState } as unknown as FretePayload;
      
      if (statusCalculado === AppTripState.DISPONIVEL && wasForcedReset) {
         ftiRadar.dispatch({ userId: 'system', eventType: 'DRIVER_CANCELED', data: freightPayloadToBroadcast, timestamp: new Date().toISOString() });
      }
      if (statusCalculado === AppTripState.EM_TRANSPORTE) {
         ftiRadar.dispatch({ userId: finalDocumentState.motoristaId || 'unknown', eventType: 'TRIP_STARTED', data: freightPayloadToBroadcast, timestamp: new Date().toISOString() });
      }
      if (statusCalculado === AppTripState.ENTREGUE || statusCalculado === 'finalizado') {
         ftiRadar.dispatch({ userId: finalDocumentState.motoristaId || 'unknown', eventType: 'TRIP_COMPLETED', data: freightPayloadToBroadcast, timestamp: new Date().toISOString() });
      }

      if (statusCalculado === AppTripState.DISPONIVEL && finalDocumentState.dispatchStatus !== 'aberto_no_feed') {
        try {
          // 🔥 FIX: Uso correto da classe com D maiúsculo
          DispatchQueueService.iniciarFila(freightPayloadToBroadcast).catch((err: unknown) => 
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

  static async executarRedispatch(frete: FretePayload): Promise<void> {
    try {
      await this.alterarStatusViagem(frete.id, AppTripState.DISPONIVEL, { isRecusa: true });
    } catch (error: unknown) {
      console.error('[CTO-Log] REDISPATCH_ERROR', error);
    }
  }
}

export default TripLifecycleService;
