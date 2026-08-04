// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: Higienização, Destravamento de Transição e Liberação do Auto-Bid.
// Status: Trava matemática destrancada para republicações.
// =========================================================

import { doc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AppTripState, canTransition } from '../state/tripStateMachine';
import { DriverState } from '../state/driverStateMachine';
import { StateSynchronizationService } from './stateSynchronizationService';
import type { FretePayload } from './matchingEngine';
import { dispatchQueueService } from './dispatchQueueService';
import { ftiRadar } from '../core/ai/events/ia.events';

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

  static async alterarStatusViagem(freteId: string, novoStatus: AppTripState, extras: Record<string, unknown> = {}): Promise<boolean> {
    const lockKey = `trip-${freteId}-${novoStatus}`;

    if (!this.acquire(lockKey)) return false;

    try {
      const freteRef = doc(db, 'fretes', freteId);
      const snapshot = await getDoc(freteRef);

      if (!snapshot.exists()) return false;

      const data = snapshot.data();

      // Válvula de Exceção para Cancelamentos, Repasses e Auto-Bid
      const isForcedReset = novoStatus === AppTripState.DISPONIVEL && ['aceito', 'indo_coleta', 'chegou_coleta', 'coletando', 'em_transporte', 'sem_motorista', 'expirado'].includes(data.status);
      
      const permitido = canTransition(data.status as AppTripState, novoStatus);
      if (!permitido && !isForcedReset) {
        console.warn(`[CTO-Log] Transição Bloqueada: De ${data.status} para ${novoStatus}`);
        return false;
      }

      const runtime = StateSynchronizationService.synchronize(
        (data.driverState as DriverState) || DriverState.ONLINE,
        novoStatus
      );

      let paradaAtualIndex = (data.paradaAtualIndex as number) || 0;
      const totalParadas = data.paradas && Array.isArray(data.paradas) ? data.paradas.length : 1;

      let statusReal = runtime.tripState;
      
      if (novoStatus === AppTripState.ENTREGUE && paradaAtualIndex + 1 < totalParadas) {
        paradaAtualIndex += 1;
        statusReal = AppTripState.EM_TRANSPORTE; 
      }

      // 🛡️ BLINDAGEM CTO: Desativado o interceptador de expiração que bloqueava as republicações
      // Agora o sistema confia no painel do Embarcador para definir quando a carga morre ou renasce.

      await updateDoc(freteRef, {
        status: statusReal,
        paradaAtualIndex,
        runtime,
        atualizadoEm: serverTimestamp(),
        ...extras,
      });

      // Acordando a IA Operacional
      const freightPayload = { id: freteId, ...data, status: statusReal };
      
      if (statusReal === AppTripState.DISPONIVEL && isForcedReset) {
         ftiRadar.dispatch({ userId: 'system', eventType: 'DRIVER_CANCELED', data: freightPayload, timestamp: new Date().toISOString() });
      }
      if (statusReal === AppTripState.EM_TRANSPORTE) {
         ftiRadar.dispatch({ userId: data.motoristaId || 'unknown', eventType: 'TRIP_STARTED', data: freightPayload, timestamp: new Date().toISOString() });
      }
      if (statusReal === AppTripState.ENTREGUE || statusReal === 'finalizado') {
         ftiRadar.dispatch({ userId: data.motoristaId || 'unknown', eventType: 'TRIP_COMPLETED', data: freightPayload, timestamp: new Date().toISOString() });
      }

      // GATILHO AUTOMÁTICO: Se virou DISPONIVEL, inicia busca
      if (statusReal === AppTripState.DISPONIVEL && data.dispatchStatus !== 'aberto_no_feed') {
        try {
          const fretePayload = {
            id: freteId,
            ...data,
            status: statusReal,
          } as FretePayload;
                
          dispatchQueueService.iniciarFila(fretePayload).catch((err: unknown) => 
            console.error('[CTO-Log] AUTO_DISPATCH_ERROR', err)
          );
                
          console.log(`[CTO-Log] Auto-dispatch iniciado para frete ${freteId}`);
        } catch (dispatchError: unknown) {
          console.error('[CTO-Log] Falha ao iniciar auto-dispatch:', dispatchError);
        }
      }

      return true;
    } catch (error: unknown) {
      console.error('[CTO-Log] TRIP_LIFECYCLE_ERROR:', error);
      return false;
    } finally {
      this.release(lockKey);
    }
  }

  static async executarRedispatch(frete: FretePayload): Promise<void> {
    try {
      await this.alterarStatusViagem(frete.id, AppTripState.BUSCANDO_MOTORISTA);
      await dispatchQueueService.iniciarFila(frete);
    } catch (error: unknown) {
      console.error('[CTO-Log] REDISPATCH_ERROR', error);
    }
  }
}

export default TripLifecycleService;
