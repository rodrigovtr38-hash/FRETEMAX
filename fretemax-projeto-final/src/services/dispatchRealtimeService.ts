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
        motoristaId: driverId,
        reservadoEm: Date.now() // 🔥 INJEÇÃO DO TEMPO DA RESERVA
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

  // 🔥 NOVA FUNÇÃO: DEVOLVE A CARGA PRO RADAR SE O CLIENTE NÃO PAGAR
  async cancelarReservaPorTimeout(driverId: string, freteId: string) {
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
        motoristaId: null,
        motoristaNome: null,
        motoristaZap: null,
        motoristaLat: null,
        motoristaLng: null,
        alertaInsucesso: true,
        motivoCancelamento: 'O cliente não realizou o pagamento no prazo de 10 minutos.'
      });

      locationRealtimeService.stop();
    } catch (error) {
      console.error('ERRO AO CANCELAR RESERVA POR TIMEOUT:', error);
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
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('FRETOGO_TRIP_FINISHED'));
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
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('FRETOGO_TRIP_FINISHED'));
    } catch (error) {
      console.error('ERRO AO ABORTAR VIAGEM:', error);
      throw error;
    }
  }

  async iniciarColeta(driverId: string) {
    try { await firebaseRealtimeService.updateDriverRealtime(driverId, { state: DriverState.INDO_COLETA, atualizadoEm: Date.now() }); } catch (error) { console.error('ERRO:', error); }
  }

  async chegouColeta(driverId: string) {
    try { await firebaseRealtimeService.updateDriverRealtime(driverId, { state: DriverState.CHEGOU_COLETA, atualizadoEm: Date.now() }); } catch (error) { console.error('ERRO:', error); }
  }

  async iniciouColetando(driverId: string) {
    try { await firebaseRealtimeService.updateDriverRealtime(driverId, { state: DriverState.COLETANDO, atualizadoEm: Date.now() }); } catch (error) { console.error('ERRO:', error); }
  }

  async iniciarTransporte(driverId: string) {
    try { await firebaseRealtimeService.updateDriverRealtime(driverId, { state: DriverState.EM_TRANSPORTE, atualizadoEm: Date.now() }); } catch (error) { console.error('ERRO:', error); }
  }

  async finalizarEntrega(driverId: string) {
    try { await firebaseRealtimeService.updateDriverRealtime(driverId, { state: DriverState.FINALIZANDO, atualizadoEm: Date.now() }); } catch (error) { console.error('ERRO:', error); }
  }

  async atualizarTripRealtime(tripId: string, payload: Record<string, unknown>) {
    try { await firebaseRealtimeService.updateTripRealtime(tripId, { ...payload, atualizadoEm: Date.now() }); } catch (error) { console.error('ERRO:', error); }
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
    try { await firebaseRealtimeService.updateTripRealtime(freteId, { chavePixMotorista: chavePix, pixEnviadoEm: Date.now() }); } catch (error) { throw error; }
  }

  async registrarVisualizacao(freteId: string) {
    try { await firebaseRealtimeService.updateTripRealtime(freteId, { visualizacoes: increment(1) }); } catch (error) {}
  }

  async registrarInteresse(freteId: string) {
    try { await firebaseRealtimeService.updateTripRealtime(freteId, { interessados: increment(1) }); } catch (error) {}
  }
}

export const dispatchRealtimeService = new DispatchRealtimeService();
