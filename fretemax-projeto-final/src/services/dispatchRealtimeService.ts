// =========================================================
// NOME DO ARQUIVO: src/services/dispatchRealtimeService.ts
// CTO-Log: Telemetria Live e Transação Atômica de Encerramento.
// Status: Certificado. Escrita em Batch para evitar anomalias de conexão e garantir liberação do Motorista.
// =========================================================

import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { firebaseRealtimeService } from './firebaseRealtimeService';
import { locationRealtimeService } from './locationRealtimeService';
import { DriverState } from '../state/driverStateMachine';
import { AppTripState } from '../state/tripStateMachine'; 

class DispatchRealtimeService {
  async setDriverOnline(driverId: string) {
    try {
      await firebaseRealtimeService.updateDriverRealtime(driverId, {
        online: true,
        disponivel: true,
        state: DriverState.ONLINE,
        atualizadoEm: Date.now(),
      });
      // O GPS de alta precisão não deve drenar bateria de motorista ocioso.
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

  async enviarOfertaRealtime(driverId: string, payload: any) {
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

  // Aceite 100% Atômico
  async aceitarCorrida(driverId: string, freteId: string) {
    try {
      const batch = writeBatch(db);
      const timestamp = Date.now();

      const driverRef = doc(db, 'motoristas', driverId);
      const freteRef = doc(db, 'fretes', freteId);

      batch.update(driverRef, {
        state: DriverState.ACEITOU,
        freteAtualId: freteId,
        disponivel: false,
        atualizadoEm: timestamp,
      });

      batch.update(freteRef, {
        status: AppTripState.ACEITO,
        motoristaId: driverId,
        atualizadoEm: timestamp,
      });

      await batch.commit();

      locationRealtimeService.start(driverId, freteId);
    } catch (error) {
      console.error('ERRO ACEITE ATÔMICO (BATCH):', error);
      throw error;
    }
  }

  // 🔥 CTO FIX: Transação Atômica de Encerramento (Libera o Motorista + Finaliza o Frete)
  async concluirViagemELiberarMotorista(driverId: string, freteId: string) {
    try {
      const batch = writeBatch(db);
      const timestamp = Date.now();

      const driverRef = doc(db, 'motoristas', driverId);
      const freteRef = doc(db, 'fretes', freteId);

      // 1. Libera o Motorista para o Feed
      batch.update(driverRef, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        disponivel: true,
        atualizadoEm: timestamp,
      });

      // 2. Finaliza a Viagem (Pronto para o Admin pagar via PIX)
      batch.update(freteRef, {
        status: AppTripState.ENTREGUE,
        entregueEm: timestamp,
        atualizadoEm: timestamp,
      });

      await batch.commit();

      // 3. Desliga a telemetria pesada de GPS
      locationRealtimeService.stop();
    } catch (error) {
      console.error('ERRO AO CONCLUIR VIAGEM (BATCH):', error);
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
        state: DriverState.COLETANDO,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO CHEGADA COLETA:', error);
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
        disponivel: true,
        freteAtualId: null,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO FINALIZAÇÃO:', error);
    }
  }

  async atualizarTripRealtime(tripId: string, payload: any) {
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
      await firebaseRealtimeService.updateTripRealtime(tripId, {
        status,
        atualizadoEm: Date.now(),
      });
    } catch (error) {
      console.error('ERRO STATUS TRIP:', error);
    }
  }
}

export const dispatchRealtimeService = new DispatchRealtimeService();
