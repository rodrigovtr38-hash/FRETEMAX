// ============================================================================
// ARQUIVO: ia.memory.ts
// PASTA: src/core/ai/memory/
// OBJETIVO: Gerenciador de Contexto e Histórico de Conversas (Memória RAM)
// ============================================================================

export interface MessageRecord {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

/**
 * Classe responsável por manter a coerência da conversa.
 * Otimizada para rodar em memória de forma leve e limpar lixo digital.
 */
export class FTIMemoryManager {
  private history: Map<string, MessageRecord[]> = new Map();
  // Limite de segurança: Lembra apenas das últimas 8 mensagens para não estourar o custo (tokens) do Google Gemini.
  private readonly MAX_HISTORY_LENGTH = 8; 

  // Recupera o histórico de um motorista específico
  public getHistory(userId: string): MessageRecord[] {
    return this.history.get(userId) || [];
  }

  // Adiciona uma nova mensagem à linha do tempo do usuário
  public addMessage(userId: string, role: 'user' | 'model', content: string): void {
    const currentHistory = this.getHistory(userId);
    
    currentHistory.push({
      role,
      content,
      timestamp: Date.now()
    });

    // Poda de segurança (FIFO): Remove a mensagem mais velha se passar de 8
    if (currentHistory.length > this.MAX_HISTORY_LENGTH) {
      currentHistory.shift(); 
    }

    this.history.set(userId, currentHistory);
  }

  // Limpa a memória (acionado automaticamente quando um frete é finalizado ou a sessão expira)
  public clearMemory(userId: string): void {
    this.history.delete(userId);
  }
}

// Exporta uma instância única (Singleton) para ser usada em todo o app
export const ftiMemory = new FTIMemoryManager();
