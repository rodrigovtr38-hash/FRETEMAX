// ============================================================================
// ARQUIVO: ia.config.ts
// PASTA: src/core/ai/config/
// OBJETIVO: Central de Injeção de Dependências e Configurações de Escala da IA
// ============================================================================

export const FTI_CONFIG = {
  // Modelo neural selecionado para velocidade (latência baixa para realtime)
  modelName: 'gemini-1.5-flash',
  
  // Injeção da chave de API via variável de ambiente (Segurança de Produção)
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  
  // Temperatura 0.2: Extrema precisão lógica, zero invenção. Ideal para logística.
  temperature: 0.2,
  
  // Limite de tokens para evitar custos absurdos de API em requisições longas
  maxTokens: 1024,
  
  version: '1.0.0-production',

  // Travas de segurança do sistema
  security: {
    blockGenericResponses: true, // Força a IA a usar os dados do Firestore
    enforceJSONContracts: true   // Garante que a IA sempre responda no formato JSON esperado pelo sistema
  }
};
