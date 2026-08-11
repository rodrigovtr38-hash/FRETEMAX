// ============================================================================
// ARQUIVO: src/core/ai/memory/ia.memory.ts
// PASTA: src/core/ai/memory/
// CTO-Log: FASE 3 - BLOCO 3 (Faxina de Banco de Dados)
// Status: Memória RAM otimizada e Garbage Collector (Vassoura) ativado.
// ============================================================================

import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';

export interface MessageRecord {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

/**
 * Classe responsável por manter a coerência da conversa e limpar lixo digital da plataforma.
 */
export class FTIMemoryManager {
  private history: Map<string, MessageRecord[]> = new Map();
  private readonly MAX_HISTORY_LENGTH = 8; 

  // --- 1. GERENCIAMENTO DE MEMÓRIA VOLÁTIL (CHAT E CONTEXTO) ---

  public getHistory(userId: string): MessageRecord[] {
    return this.history.get(userId) || [];
  }

  public addMessage(userId: string, role: 'user' | 'model', content: string): void {
    const currentHistory = this.getHistory(userId);
    
    currentHistory.push({
      role,
      content,
      timestamp: Date.now()
    });

    if (currentHistory.length > this.MAX_HISTORY_LENGTH) {
      currentHistory.shift(); 
    }

    this.history.set(userId, currentHistory);
  }

  public clearMemory(userId: string): void {
    this.history.delete(userId);
  }

  // --- 2. GARBAGE COLLECTOR (VASSOURA DE BANCO DE DADOS) ---
  
  /**
   * Executa a limpeza pesada no banco de dados.
   * Remove fretes de teste ou mortos que já passaram do tempo limite de guarda.
   */
  public async executarFaxinaBancoDeDados(diasLimite: number = 30): Promise<{ deletados: number, status: string }> {
    console.log(`[FTI Vassoura] Iniciando varredura por lixo digital de ${diasLimite} dias atrás...`);
    
    try {
      const dataCorte = new Date();
      dataCorte.setDate(dataCorte.getDate() - diasLimite);

      // Puxa apenas fretes que não são mais úteis (Entregues ou Cancelados)
      const fretesRef = collection(db, 'fretes');
      const q = query(fretesRef, where('status', 'in', ['cancelado', 'finalizado', 'entregue', 'erro_pagamento']));
      const snapshot = await getDocs(q);

      const batch = writeBatch(db);
      let deletadosCount = 0;

      snapshot.forEach((documento) => {
        const data = documento.data();
        const dataAtualizacao = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());

        // Se a carga for mais velha que a data de corte, entra na fila de exclusão
        if (dataAtualizacao < dataCorte) {
          batch.delete(documento.ref);
          deletadosCount++;
        }
      });

      if (deletadosCount > 0) {
        await batch.commit();
        console.log(`[FTI Vassoura] Limpeza concluída. ${deletadosCount} registros antigos pulverizados.`);
      } else {
        console.log(`[FTI Vassoura] Banco de dados já está limpo. Nenhum lixo encontrado.`);
      }

      return { deletados: deletadosCount, status: 'sucesso' };
    } catch (error) {
      console.error('[FTI Vassoura] Erro crítico ao tentar limpar o banco de dados:', error);
      return { deletados: 0, status: 'erro' };
    }
  }
}

export const ftiMemory = new FTIMemoryManager();
