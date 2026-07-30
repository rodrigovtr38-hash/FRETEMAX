// =========================================================
// NOME DO ARQUIVO: src/services/dispatchQueueService.ts
// CTO-Log: Auditoria de Despacho Distribuído - LOTE 3.4
// Correção Crítica: Remoção da Morte Súbita baseada no relógio local do usuário.
// O Backend agora respeita 100% o modelo "Mural/Feed". A carga NUNCA expira sozinha na tela.
// =========================================================

import { doc, getDoc, serverTimestamp, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  buscarMotoristasCompativeis, 
  enviarOfertaMotorista, 
  FretePayload, 
  MotoristaMatch 
} from './matchingEngine';
import { AppTripState } from '../state/tripStateMachine';

const DRIVER_RESPONSE_TIMEOUT = 30000; 
const MAX_REDISPATCH_ATTEMPTS = 10;

interface QueueState {
  index: number;
  tentativa: number;
}

export class DispatchQueueService {
  static async iniciarFila(frete: FretePayload) {
    try {
      const motoristas = await buscarMotoristasCompativeis(frete);

      // 🔥 INTERVENÇÃO CTO: Se não achar motorista, NÃO MATAR A CARGA. 
      // Joga para o Mural (Feed Aberto) para que motoristas vejam passivamente.
      if (!motoristas || motoristas.length === 0) {
        console.warn(`[DISPATCH] 🛡️ Sem motoristas imediatos. Mantendo carga ${frete.id} VIVA no Feed Público.`);
        await updateDoc(doc(db, 'fretes', frete.id), {
          status: AppTripState.DISPONIVEL,
          dispatchStatus: 'aberto_no_feed', // Fixado no mural permanentemente
          filaTotal: 0,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      await updateDoc(doc(db, 'fretes', frete.id), {
        status: AppTripState.DISPONIVEL,
        dispatchStatus: 'em_andamento',
        filaTotal: motoristas.length,
        updatedAt: serverTimestamp(),
      });

      console.log(`[DISPATCH] Iniciando fila para ${motoristas.length} motoristas. Carga: ${frete.id}`);
      await DispatchQueueService.processarFila(frete, motoristas, { index: 0, tentativa: 1 });
    } catch (error: any) {
      console.error('[DISPATCH_QUEUE_ERROR]', error);
    }
  }

  static async processarFila(frete: FretePayload, motoristas: MotoristaMatch[], state: QueueState) {
    try {
      const freteSnap = await getDoc(doc(db, 'fretes', frete.id));
      
      if (!freteSnap.exists()) return;
      
      const data = freteSnap.data();

      // Se a carga já foi aceita ou cancelada, interrompe a fila.
      if (data.status !== AppTripState.DISPONIVEL && data.status !== AppTripState.AGUARDANDO_ACEITE) {
        return;
      }

      // 🔥 INTERVENÇÃO CTO: O Cronômetro de Timeout Global baseado no celular foi ERRADICADO daqui.
      // Se a IA cansar de procurar ou os motoristas rejeitarem, a carga apenas desce para o Mural.

      if (state.index >= motoristas.length || state.tentativa > MAX_REDISPATCH_ATTEMPTS) {
        console.warn(`[DISPATCH] Fila esgotada. Mantendo carga ${frete.id} no Feed Público (Mural).`);
        await updateDoc(doc(db, 'fretes', frete.id), {
          status: AppTripState.DISPONIVEL, 
          dispatchStatus: 'aberto_no_feed',
          updatedAt: serverTimestamp(),
        });
        return;
      }

      const motorista = motoristas[state.index];
      const enviado = await enviarOfertaMotorista(motorista.id, frete);

      if (!enviado) {
        // Falhou ao enviar (ex: offline). Pula rápido pro próximo, mas não mata a carga ao final.
        await DispatchQueueService.processarFila(frete, motoristas, { index: state.index + 1, tentativa: state.tentativa + 1 });
        return;
      }

      await updateDoc(doc(db, 'fretes', frete.id), {
        motoristaAtualDestaque: motorista.id,
        motoristaAtualNome: motorista.nome,
        dispatchIndex: state.index,
        dispatchTentativa: state.tentativa,
        status: AppTripState.AGUARDANDO_ACEITE,
        updatedAt: serverTimestamp(),
      });

      // Aguarda 30 segundos pela resposta do motorista antes de iterar
      setTimeout(async () => {
        try {
          const freteRef = doc(db, 'fretes', frete.id);
          let deveMoverParaProximo = false;

          await runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(freteRef);
            if (!snapshot.exists()) return;
            
            const freteDados = snapshot.data();
            
            // Se o motorista ainda não respondeu, destitui ele e volta pra fila
            if (freteDados.status === AppTripState.AGUARDANDO_ACEITE && freteDados.motoristaAtualDestaque === motorista.id) {
              transaction.update(freteRef, {
                status: AppTripState.DISPONIVEL,
                updatedAt: serverTimestamp(),
              });
              deveMoverParaProximo = true;
            }
          });

          if (deveMoverParaProximo) {
            await DispatchQueueService.processarFila(frete, motoristas, {
              index: state.index + 1,
              tentativa: state.tentativa + 1,
            });
          }

        } catch (error: any) {
          console.error('[DISPATCH_WATCHDOG_RACE_ERROR]', error);
          await DispatchQueueService.processarFila(frete, motoristas, { index: state.index + 1, tentativa: state.tentativa + 1 });
        }
      }, DRIVER_RESPONSE_TIMEOUT);
      
    } catch (error: any) {
      console.error('[PROCESSAR_FILA_ERROR]', error);
    }
  }
}
