// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: Higienização de Sintaxe, Tipagem Rigorosa e BLINDAGEM DE TIMEOUT (LOTE 7)
// Status: Lock Multi-Drop garantido. Morte Súbita bloqueada na raiz do Firestore.
// =========================================================

import { doc, getDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AppTripState, canTransition } from '../state/tripStateMachine';
import { DriverState } from '../state/driverStateMachine';
import { StateSynchronizationService } from './stateSynchronizationService';
import type { FretePayload } from './matchingEngine';
import { dispatchQueueService } from './dispatchQueueService';

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

      // Verifica se a transição é válida matematicamente
      const permitido = canTransition(data.status as AppTripState, novoStatus);
      if (!permitido) {
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

      // 🛡️ BLINDAGEM CTO: INTERCEPTADOR DE MORTE SÚBITA
      // Se o sistema tentar matar o frete, verificamos se ele tem pelo menos 10 minutos de vida.
      const statusCriticos = ['EXPIRADO', 'SEM_MOTORISTA', 'TIMEOUT', AppTripState.CANCELADO];
      if (statusCriticos.includes(statusReal as string)) {
         const criadoEm = data.criadoEm instanceof Timestamp ? data.criadoEm.toDate() : new Date();
         const tempoDecorridoMs = Date.now() - criadoEm.getTime();
         const dezMinutosMs = 10 * 60 * 1000;

         // Se tem menos de 10 minutos, bloqueia a morte e força a voltar para DISPONIVEL no Radar
         if (tempoDecorridoMs < dezMinutosMs) {
            console.warn(`[CTO-Log] 🛡️ ALERTA: Tentativa de expirar frete precocemente. Tempo de vida atual: ${Math.round(tempoDecorridoMs/1000)}s. Interceptado e mantido no Feed.`);
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

      // GATILHO AUTOMÁTICO: Se virou DISPONIVEL, inicia busca por motoristas
      if (statusReal === AppTripState.DISPONIVEL) {
        try {
          const fretePayload = {
            id: freteId,
            ...data,
            status: statusReal,
          } as FretePayload;
                
          // Dispara matching em background (não bloqueia retorno)
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
