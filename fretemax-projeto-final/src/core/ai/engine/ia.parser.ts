// ============================================================================
// ARQUIVO: ia.parser.ts
// PASTA: engine/
// OBJETIVO: Analisador (Parser) da resposta bruta da IA para o formato do App
// ============================================================================

import { IAResponse } from '../types/ia.responses';

/**
 * Intercepta a resposta bruta do LLM (Gemini) e a transforma no contrato estrito IAResponse.
 * Garante que a interface do usuário nunca sofra um 'crash' devido a formatações inesperadas.
 */
export const parseAIResponse = (rawContent: string): IAResponse => {
  try {
    // 1. Tenta extrair um bloco JSON válido caso a IA tenha retornado uma estrutura de comando
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validação básica do contrato de resposta
      if (parsed.status && parsed.type) {
        return parsed as IAResponse;
      }
    }

    // 2. Se não encontrou JSON ou faltou campos, assume que é uma resposta conversacional
    return {
      status: 'success',
      type: 'text',
      content: rawContent.trim(),
      actionRequired: false
    };

  } catch (error) {
    // LOG DE AUDITORIA: Registra a falha de formatação sem quebrar o app
    console.warn('[FTI Parser] Falha ao processar estrutura da IA. Aplicando Fallback.', error);
    
    // 3. Fallback de Segurança Máxima
    return {
      status: 'success',
      type: 'text',
      content: rawContent.trim(),
      actionRequired: false
    };
  }
};
