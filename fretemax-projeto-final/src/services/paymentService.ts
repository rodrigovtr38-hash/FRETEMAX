// =========================================================
// NOME DO ARQUIVO: src/services/paymentService.ts
// CTO-Log: Fase 3 - Homologação Operacional Distribuída.
// Evolução Fase 5: Remoção da sobrescrita otimista do TripState.
// Apenas o Webhook pode liberar a viagem de RESERVA para ACEITO.
// =========================================================

import {
  doc, updateDoc, serverTimestamp, runTransaction, getDoc, 
  collection, query, where, getDocs, limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { eventBusService, AppEvents } from './eventBusService';
import { firebaseRealtimeService } from './firebaseRealtimeService';
import { AppTripState } from '../state/tripStateMachine';

type PaymentPayload = {
  valor: number;
  descricao: string;
  clienteId: string;
  freteId: string;
};

type PaymentResponse = {
  success: boolean;
  transactionId?: string;
  error?: string;
};

class PaymentService {
  private readonly TIMEOUT = 15000;

  private async fetchWithTimeout(url: string, options: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, this.TIMEOUT);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  async processarPagamento(payload: PaymentPayload): Promise<PaymentResponse> {
    try {
      const freteRef = doc(db, 'fretes', payload.freteId);
      const freteSnap = await getDoc(freteRef);
      
      if (!freteSnap.exists()) {
        return { success: false, error: 'FRETE_NAO_ENCONTRADO' };
      }
      
      const freteData = freteSnap.data();
      const valorEsperado = Number(freteData.valorTotal || freteData.valorFreteBruto || 0);
      
      // 🔥 CTO FIX: Anti-fraude inteligente.
      if (payload.valor < valorEsperado * 0.98) {
        console.error('[CTO-Log] FRAUDE BLOQUEADA - Tentativa de pagar menos. Enviado:', payload.valor, 'Banco:', valorEsperado);
        eventBusService.emit(AppEvents.PAYMENT_FAILED, payload);
        return { success: false, error: 'VALOR_INVALIDO_FRAUDE' };
      }

      const response = await this.fetchWithTimeout('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, idPedido: payload.freteId }),
      });

      if (!response.ok) {
        eventBusService.emit(AppEvents.PAYMENT_FAILED, payload);
        return { success: false, error: 'ERRO_PAGAMENTO' };
      }

      const data = await response.json();

      await this.sincronizarPagamento(payload.freteId, data.transactionId || data.id);

      eventBusService.emit(AppEvents.PAYMENT_APPROVED, {
        freteId: payload.freteId,
        transactionId: data.transactionId || data.id,
      });

      return { success: true, transactionId: data.transactionId || data.id };
    } catch (error) {
      console.error('[CTO-Log] PAYMENT ERROR:', error);
      eventBusService.emit(AppEvents.PAYMENT_FAILED, payload);
      return { success: false, error: 'FALHA_PROCESSAMENTO' };
    }
  }

  private async sincronizarPagamento(freteId: string, transactionId: string) {
    try {
      const freteRef = doc(db, 'fretes', freteId);

      await runTransaction(db, async (transaction) => {
        const freteSnap = await transaction.get(freteRef);
        if (!freteSnap.exists()) throw new Error('Frete não encontrado');

        const dados = freteSnap.data();
        
        if (dados.pagamentoId || dados.transactionId) {
          console.warn('[CTO-Log] Este frete já possui um ID de transação registrado.');
          return;
        }

        // 🔥 CTO FIX: Remoção da linha que forçava status: DISPONIVEL
        // A geração do checkout não libera a viagem, nem re-joga no radar.
        transaction.update(freteRef, {
          pagamentoStatus: 'processando',
          pagamentoId: transactionId,
          transactionId: transactionId, 
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`[CTO-Log] Checkout ${transactionId} gerado. Aguardando Webhook do Banco...`);

      // 🔥 CTO FIX: Remoção do status falso para não ejetar a Reserva
      await firebaseRealtimeService.updateTripRealtime(freteId, {
        pagamentoStatus: 'processando',
        pagamentoId: transactionId,
        transactionId,
      });
      
    } catch (error) {
      console.error('[CTO-Log] SYNC PAYMENT ERROR:', error);
      throw error; 
    }
  }

  async processarReembolso(transactionId: string, freteId?: string): Promise<boolean> {
    try {
      let idPedido = freteId;
      
      if (!idPedido) {
        const q = query(collection(db, 'fretes'), where('pagamentoId', '==', transactionId), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          idPedido = querySnapshot.docs[0].id;
        }
      }

      const response = await this.fetchWithTimeout('/api/reembolso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPedido, transactionId }), 
      });

      if (!response.ok) return false;

      if (idPedido) {
        const freteRef = doc(db, 'fretes', idPedido);
        await updateDoc(freteRef, {
          pagamentoStatus: 'reembolsado',
          reembolsado: true,
          updatedAt: serverTimestamp(),
        });
      }

      eventBusService.emit(AppEvents.PAYMENT_REFUNDED, { transactionId, freteId: idPedido });
      return true;
    } catch (error) {
      console.error('[CTO-Log] REFUND ERROR:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();
