// ============================================================================
// ARQUIVO: ia.responses.ts
// FASE 4: Tipos e Contratos (TypeScript)
// OBJETIVO: Padronizar o formato de saída e respostas da Inteligência (FTI)
// ============================================================================

/**
 * Níveis de urgência detectados na mensagem do usuário (útil para suporte).
 */
export type MessageUrgency = 'baixa' | 'normal' | 'alta' | 'critica';

/**
 * Estrutura para botões de ação rápida (Quick Replies) que a IA pode sugerir.
 */
export interface SuggestedAction {
  label: string;       // O texto que aparece no botão (Ex: "Ver fretes")
  actionCode: string;  // O comando interno (Ex: "NAVIGATE_TO_FREIGHTS")
  payload?: any;       // Dados extras necessários para a ação
}

/**
 * Contrato rigoroso de como a IA deve devolver a resposta para o frontend.
 * O aplicativo só aceitará respostas que sigam este padrão exato.
 */
export interface IAParsedResponse {
  text: string;                      // Texto limpo que será exibido no balão de chat
  urgencyLevel: MessageUrgency;      // Termômetro da situação
  suggestedActions?: SuggestedAction[]; // Botões interativos dinâmicos (opcional)
  requiresHumanEscalation: boolean;  // Se 'true', o app avisa o Suporte L2
  internalAlertCode?: string;        // Usado se a IA detectar fraude ou erro técnico
}
