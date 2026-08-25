// =========================================================
// NOME DO ARQUIVO: src/services/dispatchRealtimeService.ts
// CTO-Log: FASE 4 - Reconstrução Controlada (Etapa 3).
// Evolução Fase 5: Motorista agora assume a Reserva (RESERVADO_AGUARDANDO_PAGAMENTO) antes do Aceite Real.
// Evolução Fase 6: Liberação do motorista (Destravamento da Reserva + Start GPS) interligada ao Webhook Financeiro.
// Evolução Fase 18: Correção das Primitivas de RTDB (Limpeza Prematura evitada e Salto de Estados corrigido).
// Bloco GPS-01: Remoção do disparo automático de GPS na liberação. O Rastreamento agora é estritamente Opt-In.
// =========================================================

import { increment } from 'firebase/firestore';
import { auth } from '../firebase';
import { firebaseRealtimeService } from './firebaseRealtimeService';
import { locationRealtimeService } from './locationRealtimeService';
import { DriverState } from '../state/driverStateMachine';
import { AppTripState } from '../state/tripStateMachine';
import { TripLifecycleService } from './tripLifecycleService';

class DispatchRealtimeService {
  async setDriverOnline(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        online: true,
        disponivel: true,
        state: DriverState.ONLINE,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO DRIVER ONLINE:', error);
    }
  }

  async setDriverOffline(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        online: false,
        disponivel: false,
        state: DriverState.OFFLINE,
        atualizadoEm: Date.now(),
      });
      locationRealtimeService.stop();
    } catch (error) {
      console.error('ERRO DRIVER OFFLINE:', error);
    }
  }

  async enviarOfertaRealtime(driverId: string, payload: Record<string, unknown>) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        novaOferta: {
          ...payload,
          status: 'pendente',
          criadaEm: Date.now(),
          expiraEm: Date.now() + 45000, 
        },
        state: DriverState.RECEBENDO_OFERTA,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO OFERTA REALTIME:', error);
    }
  }

  async aceitarCorrida(driverId: string, freteId: string) {
    try {
      const sucesso = await TripLifecycleService.alterarStatusViagem(freteId, AppTripState.RESERVADO_AGUARDANDO_PAGAMENTO, { 
        motoristaId: driverId 
      });

      if (!sucesso) {
        throw new Error('Falha ao registrar reserva. A carga pode já ter sido assumida ou expirada.');
      }

      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.RESERVADO, 
        freteAtualId: freteId,
        activeTripId: freteId, 
        disponivel: false,
        atualizadoEm: Date.now(),
      });

    } catch (error) {
      console.error('ERRO ACEITE DE CORRIDA:', error);
      throw error;
    }
  }

  async confirmarLiberacaoMotorista(freteId: string, motoristaId?: string) {
    try {
      const currentUid = auth.currentUser?.uid;
      
      if (!currentUid) return;

      if (motoristaId && currentUid !== motoristaId) {
        console.warn(`[CTO-Log] Liberação ignorada: O motorista local (${currentUid}) não é o titular desta reserva.`);
        return;
      }

      await firebaseRealtimeService.updateDriverRealtime(currentUid, {
        state: DriverState.ACEITOU,
        freteAtualId: freteId,
        activeTripId: freteId, 
        disponivel: false,
        atualizadoEm: Date.now(),
      });

      // 🔥 CTO FIX BLOCO GPS-01: Comentado locationRealtimeService.start() para obedecer regra de Opt-In.
      // O GPS NÃO começa automaticamente ao liberar a carga.
      console.log(`[CTO-Log] Operação ${freteId} liberada pelo Escrow! Motorista ${currentUid} destravado (ACEITOU).`);
    } catch (error) {
      console.error('[CTO-Log] ERRO AO CONFIRMAR LIBERAÇÃO DO MOTORISTA:', error);
    }
  }

  async concluirViagemELiberarMotorista(driverId: string, freteId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null, 
        currentTripId: null, 
        disponivel: true,
        atualizadoEm: Date.now(),
      });

      await TripLifecycleService.alterarStatusViagem(freteId, AppTripState.ENTREGUE, {
        entregueEm: Date.now()
      });

      locationRealtimeService.stop();
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('FRETOGO_TRIP_FINISHED'));
      }
    } catch (error) {
      console.error('ERRO AO CONCLUIR VIAGEM:', error);
      throw error;
    }
  }

  async cancelarViagemMotorista(driverId: string, freteId: string, motivo: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null,
        currentTripId: null,
        disponivel: true,
        atualizadoEm: Date.now(),
      });

      await TripLifecycleService.alterarStatusViagem(freteId, AppTripState.DISPONIVEL, {
        isRecusa: true,
        motivoCancelamento: motivo,
        canceladoPorMotoristaEm: Date.now()
      });

      locationRealtimeService.stop();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('FRETOGO_TRIP_FINISHED'));
      }
    } catch (error) {
      console.error('ERRO AO ABORTAR VIAGEM:', error);
      throw error;
    }
  }

  async iniciarColeta(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.INDO_COLETA,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO INICIAR COLETA:', error);
    }
  }

  async chegouColeta(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.CHEGOU_COLETA,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO CHEGADA COLETA:', error);
    }
  }

  async iniciouColetando(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.COLETANDO,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO COLETANDO:', error);
    }
  }

  async iniciarTransporte(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.EM_TRANSPORTE,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO TRANSPORTE:', error);
    }
  }

  async finalizarEntrega(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        state: DriverState.FINALIZANDO,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO FINALIZAÇÃO:', error);
    }
  }

  async atualizarTripRealtime(tripId: string, payload: Record<string, unknown>) {
    try {
      await firebaseRealtimeService.updateTripRealtime(tripId, {
        ...payload,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO TRIP REALTIME:', error);
    }
  }

  async atualizarStatusTrip(tripId: string, status: AppTripState) {
    try {
      if (status === AppTripState.ENTREGUE && auth.currentUser?.uid) {
        await this.concluirViagemELiberarMotorista(auth.currentUser.uid, tripId);
        return;
      }
      
      await TripLifecycleService.alterarStatusViagem(tripId, status);
    } catch (error) {
      console.error('ERRO STATUS TRIP:', error);
      throw error;
    }
  }

  async salvarChavePix(freteId: string, chavePix: string) {
    try {
      await firebaseRealtimeService.updateTripRealtime(freteId, {
        chavePixMotorista: chavePix,
        pixEnviadoEm: Date.now()
      });
    } catch (error) {
      console.error('ERRO AO SALVAR PIX:', error);
      throw error;
    }
  }

  async registrarVisualizacao(freteId: string) {
    try {
      await firebaseRealtimeService.updateTripRealtime(freteId, {
        visualizacoes: increment(1)
      });
    } catch (error) {
      console.warn('Falha silenciosa ao registrar view no banco:', error);
    }
  }

  async registrarInteresse(freteId: string) {
    try {
      await firebaseRealtimeService.updateTripRealtime(freteId, {
        interessados: increment(1)
      });
    } catch (error) {
      console.warn('Falha silenciosa ao registrar interesse no banco:', error);
    }
  }
}

export const dispatchRealtimeService = new DispatchRealtimeService();
