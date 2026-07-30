// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: Higienização de Sintaxe, Tipagem Rigorosa e BLINDAGEM DE TIMEOUT (LOTE 7)
// Correção: Leitura correta da variável createdAt e bloqueio forçado contra Morte Súbita.
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

      // 🛡️ BLINDAGEM CTO: INTERCEPTADOR DE MORTE SÚBITA REVISADO
      const statusCriticos = ['EXPIRADO', 'SEM_MOTORISTA', 'TIMEOUT', AppTripState.CANCELADO];
      if (statusCriticos.includes(statusReal as string)) {
         // Correção: Buscando a variável exata do banco (createdAt)
         const dataCriacao = data.createdAt || data.criadoEm;
         const criadoEm = dataCriacao instanceof Timestamp ? dataCriacao.toDate() : new Date();
         const tempoDecorridoMs = Date.now() - criadoEm.getTime();
         const dezMinutosMs = 10 * 60 * 1000;

         // Se tem menos de 10 minutos ou houve falha no relógio, trava no Feed.
         if (tempoDecorridoMs < dezMinutosMs || tempoDecorridoMs < 0) {
            console.warn(`[CTO-Log] 🛡️ ALERTA: Tentativa de expirar frete detectada. Forçando permanência no Feed.`);
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

      // GATILHO AUTOMÁTICO: Se virou DISPONIVEL, inicia busca por motoristas (Sem travar o cliente)
      if (statusReal === AppTripState.DISPONIVEL && data.dispatchStatus !== 'aberto_no_feed') {
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
