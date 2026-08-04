// =========================================================
// NOME DO ARQUIVO: src/services/dispatchRealtimeService.ts
// CTO-Log: Correção de Path Crítico no Firestore.
// Status: Coleção corrigida de 'motoristas' para 'motoristas_cadastros' para evitar Batch Rejection (Falha Silenciosa).
// =========================================================

import { writeBatch, doc, updateDoc } from 'firebase/firestore';
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

  async aceitarCorrida(driverId: string, freteId: string) {
    try {
      const batch = writeBatch(db);
      const timestamp = Date.now();

      // 🔥 CTO FIX: Coleção corrigida de 'motoristas' para 'motoristas_cadastros'
      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const freteRef = doc(db, 'fretes', freteId);

      batch.update(driverRef, {
        state: DriverState.ACEITOU,
        freteAtualId: freteId,
        activeTripId: freteId, 
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

  async concluirViagemELiberarMotorista(driverId: string, freteId: string) {
    try {
      const batch = writeBatch(db);
      const timestamp = Date.now();

      // 🔥 CTO FIX: Coleção corrigida de 'motoristas' para 'motoristas_cadastros'
      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const freteRef = doc(db, 'fretes', freteId);

      batch.update(driverRef, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null, 
        currentTripId: null, 
        disponivel: true,
        atualizadoEm: timestamp,
      });

      batch.update(freteRef, {
        status: AppTripState.ENTREGUE,
        entregueEm: timestamp,
        atualizadoEm: timestamp,
      });

      await batch.commit();
      locationRealtimeService.stop();
      
      // Dispara evento global para forçar o Frontend a limpar o Cache
      window.dispatchEvent(new CustomEvent('FRETOGO_TRIP_FINISHED'));

    } catch (error) {
      console.error('ERRO AO CONCLUIR VIAGEM (BATCH):', error);
      throw error;
    }
  }

  async cancelarViagemMotorista(driverId: string, freteId: string, motivo: string) {
    try {
      const batch = writeBatch(db);
      const timestamp = Date.now();

      // 🔥 CTO FIX: Coleção corrigida de 'motoristas' para 'motoristas_cadastros'
      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const freteRef = doc(db, 'fretes', freteId);

      batch.update(driverRef, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null,
        currentTripId: null,
        disponivel: true,
        atualizadoEm: timestamp,
      });

      batch.update(freteRef, {
        status: AppTripState.DISPONIVEL,
        motoristaId: null,
        motoristaNome: null,
        motoristaZap: null,
        alertaInsucesso: true,
        motivoCancelamento: motivo,
        canceladoPorMotoristaEm: timestamp,
        atualizadoEm: timestamp,
      });

      await batch.commit();
      locationRealtimeService.stop();

      // Dispara evento global para forçar o Frontend a limpar o Cache
      window.dispatchEvent(new CustomEvent('FRETOGO_TRIP_FINISHED'));

    } catch (error) {
      console.error('ERRO AO ABORTAR VIAGEM (BATCH):', error);
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

  async salvarChavePix(freteId: string, chavePix: string) {
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        chavePixMotorista: chavePix,
        pixEnviadoEm: Date.now()
      });
    } catch (error) {
      console.error('ERRO AO SALVAR PIX:', error);
      throw error;
    }
  }
}

export const dispatchRealtimeService = new DispatchRealtimeService();
