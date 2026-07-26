// ============================================================================
// ARQUIVO: src/core/ai/types/ia.context.ts
// FASE 4: Tipos e Contratos (TypeScript)
// OBJETIVO: Definir a estrutura do contexto de navegação e operação do app
// ============================================================================

/**
 * Representa a localização geográfica atual injetada pelo GPS do app.
 */
export interface LocationContext {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
}

/**
 * Representa o estado da interface do aplicativo (onde o usuário está clicando).
 */
export interface AppScreenContext {
  currentScreen: 'dashboard' | 'fretes_disponiveis' | 'detalhe_frete' | 'viagem_ativa' | 'carteira';
  activeOperationId?: string; // ID do frete se houver uma operação em andamento
  vehicleCategory?: string;   // Ex: 'truck', 'carreta_ls'
}

/**
 * Representa o histórico de curto prazo da conversa para manter a coerência.
 */
export interface ConversationContext {
  messageCount: number;
  lastInteractionTimestamp: number;
  isFirstInteraction: boolean;
}

/**
 * Contrato unificado que empacota todo o contexto para a IA processar.
 */
export interface FullAIContext {
  location: LocationContext | null;
  appState: AppScreenContext;
  conversation: ConversationContext;
}
