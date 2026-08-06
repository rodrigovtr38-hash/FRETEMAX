// =========================================================
// NOME DO ARQUIVO: src/services/driverStateService.ts
// CTO-Log: Correção Crítica de Consistência de Dados (Bloco 4).
// Status: Coleção unificada (motoristas -> motoristas_cadastros). Elimina o bug do Modo Retorno não aplicar filtros no Radar do Embarcador.
// =========================================================

import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DriverState, canDriverTransition } from '../state/driverStateMachine';

class DriverStateService {
  
  async changeState(uid: string, nextState: DriverState): Promise<boolean> {
    // 🔥 CTO FIX: Unificando a coleção para 'motoristas_cadastros' (Fonte única da verdade)
    const ref = doc(db, 'motoristas_cadastros', uid);
    const onlineRef = doc(db, 'motoristas_online', uid);

    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(ref);
        if (!snap.exists()) throw new Error("Motorista não encontrado");
        
        const currentState = snap.data().state || snap.data().status || DriverState.OFFLINE;
        
        if (!canDriverTransition(currentState, nextState)) {
           throw new Error(`Transição inválida de ${currentState} para ${nextState}`);
        }

        const payload = { state: nextState, atualizadoEm: serverTimestamp() };
        t.update(ref, payload);
        
        if (nextState === DriverState.OFFLINE) {
           t.delete(onlineRef);
        } else {
           t.set(onlineRef, payload, { merge: true });
        }
      });
      return true;
    } catch (e) {
      console.error("[DRIVER_STATE] Erro ao mudar estado:", e);
      return false;
    }
  }

  async ativarModoRetorno(destinoRetorno: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) return { success: false, error: 'Sessão expirada' };

      // 🔥 CTO FIX: Sincronia de coleção
      const motoristaRef = doc(db, 'motoristas_cadastros', user.uid);
      const motoristaOnlineRef = doc(db, 'motoristas_online', user.uid);

      await runTransaction(db, async (t) => {
        const snap = await t.get(motoristaRef);
        if (!snap.exists()) throw new Error("PERFIL_NAO_ENCONTRADO");

        const data = snap.data();
        const usadosHoje = data.retornosUsadosHoje || 0;

        if (usadosHoje >= 2) {
          throw new Error("LIMITE_RETORNO_DIARIO_ATINGIDO");
        }

        const novosUsados = usadosHoje + 1;
        const payload = {
          modoRetorno: true,
          destinoRetorno: destinoRetorno.trim().toLowerCase(),
          retornosUsadosHoje: novosUsados,
          dataUltimoReset: data.dataUltimoReset || serverTimestamp(), 
          atualizadoEm: serverTimestamp()
        };

        t.update(motoristaRef, payload);
        
        const snapOnline = await t.get(motoristaOnlineRef);
        if (snapOnline.exists()) {
           t.update(motoristaOnlineRef, payload);
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error("[ERRO_ATIVAR_RETORNO]", error);
      return { success: false, error: error.message };
    }
  }

  async desativarModoRetorno(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const payload = {
        modoRetorno: false,
        destinoRetorno: null,
        atualizadoEm: serverTimestamp()
      };

      // 🔥 CTO FIX: Sincronia de coleção
      await updateDoc(doc(db, 'motoristas_cadastros', user.uid), payload);
      await updateDoc(doc(db, 'motoristas_online', user.uid), payload).catch(() => {}); 
      
      return true;
    } catch (e) {
      console.error("[ERRO_DESATIVAR_RETORNO]", e);
      return false;
    }
  }
}

export const driverStateService = new DriverStateService();
