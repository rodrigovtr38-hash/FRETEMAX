// ============================================================================
// ARQUIVO: src/core/ai/prompts/ia.prompts.ts
// FASE 4: Motor de Montagem de Prompts Dinâmicos (V2 - Escala Real)
// OBJETIVO: Coletar as diretrizes do Cérebro e montar o pacote de dados
// ============================================================================

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
 * Monta o prompt base injetando a identidade da FTI e as regras inquebráveis.
 */
export const buildBaseSystemInstruction = (): string => {
  return \`
    \${FTI_SYSTEM_PROMPT}
    
    --- DIRETRIZES DE IDENTIDADE ---
    \${FTI_IDENTITY}
    
    --- REGRAS INQUEBRÁVEIS ---
    \${FTI_RULES}
  \`;
}

/**
 * Injeta os dados dinâmicos do usuário no contexto da conversa.
 */
export const buildUserContext = (context: IAContext, userMessage: string): string => {
  const roleString = context.role.toUpperCase();
  
  return \`
    [SISTEMA]: O usuário com quem você está falando é um [\${roleString}].
    [SISTEMA]: Nome do usuário: \${context.name}.
    [SISTEMA]: ID do Usuário: \${context.userId}.
    \${context.activeTripId ? \`[SISTEMA]: Ele possui um frete ativo (ID: \${context.activeTripId}).\` : ''}
    
    [MENSAGEM DO USUÁRIO]: \${userMessage}
  \`;
}
