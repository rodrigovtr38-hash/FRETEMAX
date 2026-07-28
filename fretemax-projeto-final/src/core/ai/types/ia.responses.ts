// ============================================================================
// ARQUIVO: ia.responses.ts
// PASTA: src/core/ai/types/
// OBJETIVO: Contrato Oficial de Resposta do Motor Neural FTI
// ============================================================================

/**
 * A interface definitiva que o parser (engine) devolve para o hook (React).
 * A IA DEVE formatar seu JSON exatamente assim.
 */
export interface IAResponse {
  status: 'success' | 'error' | 'action_required';
  type: 'text' | 'error' | 'freight_match' | 'support' | 'financial';
  content: string; // A mensagem que vai aparecer no balão de chat
  
  // Ações Autônomas
  actionRequired: boolean;
  actionName?: string; // Comando interno para o app (Ex: 'OPEN_MAP', 'PAY_PIX')
  actionPayload?: any; // Dados extras da ação (Ex: id do frete, valor)
  
  // Telemetria (opcional)
  metadata?: {
    processedAt?: number;
    tokens?: number;
  };
}
