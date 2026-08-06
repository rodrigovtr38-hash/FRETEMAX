// =========================================================
// NOME DO ARQUIVO: src/services/dispatchRealtimeService.ts
// CTO-Log: Fase 2 - Homologação Operacional
// Status: BUG DE DOUBLE BOOKING ERRADICADO. Atualização de estado estendida à coleção 'motoristas_online' via Batch.
// =========================================================

import { writeBatch, doc, updateDoc, increment } from 'firebase/firestore';
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
      // Sincronização paralela do radar é controlada pelo driverStateService, mas mantemos o fallback de realtime aqui.
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

      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const driverOnlineRef = doc(db, 'motoristas_online', driverId); // 🔥 CTO FIX: Acesso ao Radar Público
      const freteRef = doc(db, 'fretes', freteId);

      // 1. Atualiza Cadastro Oficial
      batch.update(driverRef, {
        state: DriverState.ACEITOU,
        freteAtualId: freteId,
        activeTripId: freteId, 
        disponivel: false,
        atualizadoEm: timestamp,
      });

      // 2. 🔥 CTO FIX: Remove Motorista do Radar de Busca Imediatamente
      batch.update(driverOnlineRef, {
        state: DriverState.ACEITOU,
        disponivel: false,
        freteAtualId: freteId,
        atualizadoEm: timestamp,
      });

      // 3. Atualiza Frete
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

      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const driverOnlineRef = doc(db, 'motoristas_online', driverId); // 🔥 CTO FIX
      const freteRef = doc(db, 'fretes', freteId);

      // Libera Cadastro Oficial
      batch.update(driverRef, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null, 
        currentTripId: null, 
        disponivel: true,
        atualizadoEm: timestamp,
      });

      // 🔥 CTO FIX: Retorna o Motorista ao Radar de Buscas
      batch.update(driverOnlineRef, {
        state: DriverState.ONLINE,
        disponivel: true,
        freteAtualId: null,
        atualizadoEm: timestamp,
      });

      // Conclui Viagem
      batch.update(freteRef, {
        status: AppTripState.ENTREGUE,
        entregueEm: timestamp,
        atualizadoEm: timestamp,
      });

      await batch.commit();
      locationRealtimeService.stop();
      
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

      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const driverOnlineRef = doc(db, 'motoristas_online', driverId); // 🔥 CTO FIX
      const freteRef = doc(db, 'fretes', freteId);

      // Libera Cadastro Oficial
      batch.update(driverRef, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null,
        currentTripId: null,
        disponivel: true,
        atualizadoEm: timestamp,
      });

      // 🔥 CTO FIX: Retorna o Motorista ao Radar de Buscas
      batch.update(driverOnlineRef, {
        state: DriverState.ONLINE,
        disponivel: true,
        freteAtualId: null,
        atualizadoEm: timestamp,
      });

      // Volta a Carga pro Mural
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

  async registrarVisualizacao(freteId: string) {
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        visualizacoes: increment(1)
      });
    } catch (error) {
      console.warn('Falha silenciosa ao registrar view no banco:', error);
    }
  }

  async registrarInteresse(freteId: string) {
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        interessados: increment(1)
      });
    } catch (error) {
      console.warn('Falha silenciosa ao registrar interesse no banco:', error);
    }
  }
}

export const dispatchRealtimeService = new DispatchRealtimeService();
