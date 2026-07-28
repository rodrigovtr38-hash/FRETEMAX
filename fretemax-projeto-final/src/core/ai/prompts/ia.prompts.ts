// ============================================================================
// ARQUIVO: ia.prompts.ts
// PASTA: src/core/ai/prompts/
// OBJETIVO: Motor de Montagem de Prompts Dinâmicos (Produção V1 - Escala Real)
// ============================================================================

// Importando o "Cérebro" da pasta knowledge
import { FTI_SYSTEM_PROMPT } from '../knowledge/ia.system.prompt.md';
import { FTI_RULES } from '../knowledge/ia.rules.md';
import { FTI_IDENTITY } from '../knowledge/ia.identity.md';

/**
 * Interface que define o formato do contexto do usuário atual.
 */
export interface IAContext {
  userId: string;
  role: 'motorista' | 'empresa' | 'admin';
  name: string;
  activeTripId?: string;
}

/**
 * Monta o System Prompt absoluto. Esta é a regra master que o Gemini NÃO PODE quebrar.
 */
export const buildBaseSystemInstruction = (): string => {
  return `
${FTI_SYSTEM_PROMPT}

--- DIRETRIZES DE IDENTIDADE ---
${FTI_IDENTITY}

--- REGRAS INQUEBRÁVEIS E CONTRATOS ---
${FTI_RULES}

[REGRA DE SISTEMA CRÍTICA E ABSOLUTA]: 
VOCÊ DEVE RESPONDER ÚNICA E EXCLUSIVAMENTE EM FORMATO JSON VÁLIDO. 
NENHUM TEXTO, SAUDAÇÃO OU EXPLICAÇÃO FORA DO JSON É PERMITIDA.
SEU RETORNO DEVE SER PARSEÁVEL POR JSON.parse().
FORMATO ESPERADO OBRIGATÓRIO: { "status": "success" | "error", "type": "chat" | "action", "content": "Sua resposta direta aqui", "actionRequired": boolean }
  `.trim();
};

/**
 * Injeta os dados dinâmicos do usuário no contexto da conversa.
 */
export const buildUserContext = (context: IAContext, userMessage: string): string => {
  const roleString = context.role.toUpperCase();
  const tripContext = context.activeTripId 
    ? `[SISTEMA]: ALERTA - O usuário possui um frete ativo no momento (ID: ${context.activeTripId}). Adapte sua resposta considerando que ele está em trânsito.` 
    : '';

  return `
[CONTEXTO DE SISTEMA INJETADO]:
- Usuário Atual: ${context.name} (ID: ${context.userId})
- Nível de Acesso: ${roleString}
${tripContext}

[MENSAGEM DO USUÁRIO]:
"${userMessage}"
  `.trim();
};
