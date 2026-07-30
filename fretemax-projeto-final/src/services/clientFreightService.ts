// =========================================================
// NOME DO ARQUIVO: src/services/clientFreightService.ts
// CTO-Log: Arquitetura Open Feed (Mural) implementada.
// Remoção do motor de despacho local. O Client apenas posta a carga (DISPONÍVEL).
// =========================================================

import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { paymentService } from './paymentService';
import { AppTripState as TripState } from '../state/tripStateMachine';

const inflightRegistry = new Set<string>();

export interface FreightPayload {
  clienteId: string;
  categoria: string;
  origem: { lat: number; lng: number; endereco?: string; cidade?: string };
  destino: { lat: number; lng: number; endereco?: string; cidade?: string };
  valor?: number;
  valorBruto?: number;
  distanciaTotalKm?: number;
  pesoKg?: number;
  tipoCarga?: string;
  paradas?: any[];
}

class ClientFreightService {
  
  private generatePin(): string { 
    return Math.floor(1000 + Math.random() * 9000).toString(); 
  }

  private round(value: number): number { 
    return Number(value.toFixed(2)); 
  }

  private buildInflightKey(payload: any): string {
    return `${payload.clienteId}_${payload.origem?.lat}_${payload.destino?.lat}`;
  }

  private normalizePayload(payload: any) {
    const paradasTratadas = payload.paradas || [];
    return {
      normalizedPayload: {
        ...payload,
        paradasTratadas
      },
      pricingMetadata: {
        valorBruto: payload.valorBruto || payload.valor || 0
      }
    };
  }

  private calcularComissao(valorBruto: number, categoria: string) {
    const cat = categoria ? categoria.toLowerCase().trim() : '';
    const ehLeve = ['moto', 'carro', 'utilitario', 'furg', 'hr', 'bongo'].some(c => cat.includes(c));
    const taxa = ehLeve ? 0.20 : 0.15; 
    
    const valorComissao = this.round(valorBruto * taxa);
    const valorLiquidoMotorista = this.round(valorBruto - valorComissao);
    
    return {
      taxaFreto: taxa * 100, 
      valorComissao,
      valorLiquidoMotorista
    };
  }

  private extrairCidadeDoEndereco(endereco: string | undefined): string {
    if (!endereco) return '';
    const partes = endereco.split(',');
    if (partes.length > 2) {
       return partes[partes.length - 2].trim(); 
    }
    return endereco.trim();
  }

  async criarFrete(payload: FreightPayload): Promise<any> {
    const inflightKey = this.buildInflightKey(payload);
    if (inflightRegistry.has(inflightKey)) return { success: false, error: 'OPERACAO_EM_PROCESSAMENTO' };
    inflightRegistry.add(inflightKey);

    try {
      const { normalizedPayload, pricingMetadata } = this.normalizePayload(payload);
      if (!normalizedPayload.origem?.lat || !normalizedPayload.destino?.lat) {
        return { success: false, error: 'COORDENADAS_INVALIDAS' };
      }

      const valorBruto = pricingMetadata.valorBruto;
      if (valorBruto <= 0) return { success: false, error: 'VALOR_BRUTO_INVALIDO' };

      const { taxaFreto, valorComissao, valorLiquidoMotorista } = this.calcularComissao(valorBruto, normalizedPayload.categoria);
      
      if (valorLiquidoMotorista <= 0) return { success: false, error: 'VALOR_LIQUIDO_INVALIDO' };

      const pinColeta = this.generatePin();
      const pinEntregas = normalizedPayload.paradasTratadas.map(() => this.generatePin());

      const cidadeDestinoFormatada = payload.destino.cidade || this.extrairCidadeDoEndereco(payload.destino.endereco);

      // 1. Cria a carga com status DISPONÍVEL e pagamento pendente
      const freteRef = await addDoc(collection(db, 'fretes'), {
        ...normalizedPayload,
        cidadeDestinoFormatada, 
        status: TripState.DISPONIVEL, 
        pagamentoStatus: 'pendente',
        dispatchStatus: 'mural_aberto', // Já prepara a tag do Mural
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
        pinColeta,
        pinEntregas,
        valorBruto,
        taxaFreto,
        valorComissao,
        valorLiquidoMotorista, 
      });

      // 2. Processa o Pagamento (Mercado Pago / Escrow)
      const pagamento = await paymentService.processarPagamento({
        valor: valorBruto, 
        descricao: `Frete ${normalizedPayload.categoria} - ID ${freteRef.id}`,
        clienteId: normalizedPayload.clienteId,
        freteId: freteRef.id,
      });

      // 3. Se falhar, cancela.
      if (!pagamento.success) {
        await updateDoc(doc(db, 'fretes', freteRef.id), { 
          status: TripState.CANCELADO, 
          pagamentoStatus: 'falhou',
          atualizadoEm: serverTimestamp()
        });
        return { success: false, error: 'PAGAMENTO_NEGADO' };
      }

      // 4. SUCESSO: Mantém DISPONIVEL (para aparecer no feed) e aprova pagamento.
      // 🛡️ CTO FIX: Nunca mude para "BUSCANDO_MOTORISTA", senão a carga some do Feed!
      await updateDoc(doc(db, 'fretes', freteRef.id), {
        pagamentoStatus: 'aprovado',
        status: TripState.DISPONIVEL, // Mantém no ar
        atualizadoEm: serverTimestamp(),
      });

      // NOTA CTO: O celular do cliente NÃO chama mais o DispatchQueueService aqui.
      // O Firebase Cloud Functions assume daqui pra frente e conta os 15 minutos.

      return { success: true, freteId: freteRef.id };
    } catch (error) {
      console.error('ERRO CRÍTICO CRIAR FRETE:', error);
      return { success: false, error: 'ERRO_CRIAR_FRETE' };
    } finally {
      inflightRegistry.delete(inflightKey);
    }
  }

  async cancelarFrete(freteId: string): Promise<any> {
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        status: TripState.CANCELADO,
        atualizadoEm: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'ERRO_CANCELAR_FRETE' };
    }
  }

  async buscarFrete(freteId: string): Promise<any> {
    try {
      const snap = await getDoc(doc(db, 'fretes', freteId));
      if (snap.exists()) return { success: true, data: { id: snap.id, ...snap.data() } };
      return { success: false, error: 'FRETE_NAO_ENCONTRADO' };
    } catch (error) {
      return { success: false, error: 'ERRO_BUSCAR_FRETE' };
    }
  }
}

export const clientFreightService = new ClientFreightService();
