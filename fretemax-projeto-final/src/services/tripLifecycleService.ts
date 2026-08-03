// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: Higienização, Destravamento de Transição e Injeção de IA Operacional.
// Status: Trava matemática destrancada para cancelamentos e Gatilho da IA conectado.
// =========================================================

import { doc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AppTripState, canTransition } from '../state/tripStateMachine';
import { DriverState } from '../state/driverStateMachine';
import { StateSynchronizationService } from './stateSynchronizationService';
import type { FretePayload } from './matchingEngine';
import { dispatchQueueService } from './dispatchQueueService';
// 🔥 INJEÇÃO CTO: Conectando a IA direto na espinha dorsal
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

      // 🔥 CTO FIX: Válvula de Exceção para Cancelamentos e Repasses.
      // A máquina de estados original bloqueava passar de "ACEITO" ou "EM_COLETA" direto para "DISPONIVEL". 
      // Esta linha permite que a devolução para o Feed do radar force a transição.
      const isForcedReset = novoStatus === AppTripState.DISPONIVEL && ['aceito', 'indo_coleta', 'chegou_coleta', 'coletando', 'em_transporte'].includes(data.status);
      
      const permitido = canTransition(data.status as AppTripState, novoStatus);
      if (!permitido && !isForcedReset) {
        console.warn(`[CTO-Log] Transição Bloqueada: De ${data.status} para ${novoStatus}`);
        return false;
      }

      // Sincroniza o estado do motorista baseado no status da viagem
      const runtime = StateSynchronizationService.synchronize(
        (data.driverState as DriverState) || DriverState.ONLINE,
        novoStatus
      );

      // FASE 5 (MULTI-DROP): Lógica para controlar as múltiplas entregas
      let paradaAtualIndex = (data.paradaAtualIndex as number) || 0;
      const totalParadas = data.paradas && Array.isArray(data.paradas) ? data.paradas.length : 1;

      let statusReal = runtime.tripState;
      
      if (novoStatus === AppTripState.ENTREGUE && paradaAtualIndex + 1 < totalParadas) {
        paradaAtualIndex += 1;
        statusReal = AppTripState.EM_TRANSPORTE; // Mantém a roda girando
      }

      // 🛡️ BLINDAGEM CTO: INTERCEPTADOR DE MORTE SÚBITA REVISADO
      const statusCriticos = ['EXPIRADO', 'SEM_MOTORISTA', 'TIMEOUT', AppTripState.CANCELADO];
      if (statusCriticos.includes(statusReal as string) && !isForcedReset) {
         const dataCriacao = data.createdAt || data.criadoEm;
         const criadoEm = dataCriacao instanceof Timestamp ? dataCriacao.toDate() : new Date();
         const tempoDecorridoMs = Date.now() - criadoEm.getTime();
         // Aumentando a resiliência: 30 minutos (1800000 ms) antes de expirar a carga
         const tempoLimiteMs = 30 * 60 * 1000; 

         if (tempoDecorridoMs < tempoLimiteMs || tempoDecorridoMs < 0) {
            console.warn(`[CTO-Log] 🛡️ ALERTA: Tentativa prematura de expirar frete. Forçando permanência no Feed.`);
            statusReal = AppTripState.DISPONIVEL; 
         }
      }

      await updateDoc(freteRef, {
        status: statusReal,
        paradaAtualIndex,
        runtime,
        atualizadoEm: serverTimestamp(),
        ...extras,
      });

      // 🔥 INJEÇÃO CTO: Acordando a IA Operacional
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

      // GATILHO AUTOMÁTICO: Se virou DISPONIVEL, inicia busca por motoristas (Sem travar o cliente)
      if (statusReal === AppTripState.DISPONIVEL && data.dispatchStatus !== 'aberto_no_feed') {
        try {
          const fretePayload = {
            id: freteId,
            ...data,
            status: statusReal,
          } as FretePayload;
                
          // Dispara matching em background
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
