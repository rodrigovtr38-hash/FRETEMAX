// =========================================================
// NOME DO ARQUIVO: src/services/dispatchRealtimeService.ts
// CTO-Log: FASE 3 - Homologação Operacional Distribuída.
// Status: "Buraco Negro do Cancelamento" corrigido. Injeção atômica de Prioridade, Atualização Temporal do TTL (30 min) na recusa.
// =========================================================

import { writeBatch, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
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

      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      const driverOnlineRef = doc(db, 'motoristas_online', driverId); 
      const freteRef = doc(db, 'fretes', freteId);

      // 1. Atualiza Cadastro Oficial
      batch.update(driverRef, {
        state: DriverState.ACEITOU,
        freteAtualId: freteId,
        activeTripId: freteId, 
        disponivel: false,
        atualizadoEm: timestamp,
      });

      // 2. Remove Motorista do Radar de Busca Imediatamente
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
      const driverOnlineRef = doc(db, 'motoristas_online', driverId); 
      const freteRef = doc(db, 'fretes', freteId);

      batch.update(driverRef, {
        state: DriverState.ONLINE, 
        freteAtualId: null,
        activeTripId: null, 
        currentTripId: null, 
        disponivel: true,
        atualizadoEm: timestamp,
      });

      batch.update(driverOnlineRef, {
        state: DriverState.ONLINE,
        disponivel: true,
        freteAtualId: null,
        atualizadoEm: timestamp,
      });

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
      const driverOnlineRef = doc(db, 'motoristas_online', driverId); 
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

      // Retorna o Motorista ao Radar de Buscas
      batch.update(driverOnlineRef, {
        state: DriverState.ONLINE,
        disponivel: true,
        freteAtualId: null,
        atualizadoEm: timestamp,
      });

      // 🔥 CTO FIX: "Buraco Negro da Recusa Resolvido". 
      // Quando um motorista solta a carga, o TTL (Time to Live) deve reiniciar com urgência no Radar (30 minutos)
      const dataExpiracao = new Date();
      dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 30);

      // Volta a Carga pro Mural como URGENTE
      batch.update(freteRef, {
        status: AppTripState.DISPONIVEL,
        motoristaId: null,
        motoristaNome: null,
        motoristaZap: null,
        alertaInsucesso: true,
        motivoCancelamento: motivo,
        canceladoPorMotoristaEm: timestamp,
        atualizadoEm: timestamp,
        prioridade: true, // Acende o FOGO de urgência no Feed
        ofertaExpiraEm: dataExpiracao, // Evita sumir do Feed
        createdAt: serverTimestamp(), // Pula pro topo do Feed em consultas padrão
        criadoEm: Date.now() // 🔥 FORÇA o Feed do motorista (AvailableFreights.tsx) a zerar o cronômetro do zero!
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
