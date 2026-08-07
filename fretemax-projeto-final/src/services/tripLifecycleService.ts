// =========================================================
// NOME DO ARQUIVO: src/services/tripLifecycleService.ts
// CTO-Log: Auditoria Final (Bloco 2 - Sistema Vivo).
// Status: Injeção atômica de "Timeline no Chat". A IA reportará cada transição do motorista para o painel do Embarcador em tempo real.
// =========================================================

import { doc, getDoc, serverTimestamp, updateDoc, collection, addDoc } from 'firebase/firestore';
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

  // 🔥 CTO FIX: "Alma da Plataforma". Cria um registro de chat sempre que o status muda.
  private static async registrarEventoDeIA(freteId: string, novoStatus: AppTripState, extras?: any) {
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
          return; // Não envia log para status intermediários não essenciais
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

      await updateDoc(freteRef, {
        status: statusReal,
        paradaAtualIndex,
        runtime,
        atualizadoEm: serverTimestamp(),
        ...extras,
      });

      // 🔥 Dispara o LOG para a tela de Embarcador/Motorista se sentirem num sistema vivo.
      await this.registrarEventoDeIA(freteId, statusReal as AppTripState, { isRecusa: isForcedReset });

      // Acordando a IA Notificadora (Event Bus Invisível)
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
