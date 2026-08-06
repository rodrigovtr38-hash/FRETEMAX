// ============================================================================
// ARQUIVO: src/core/ai/engine/ia.parser.ts
// CTO-Log: FASE 2 - Homologação Operacional
// Status: Regex e Fallback homologados para segurança anti-crash do App.
// ============================================================================

import { IAResponse } from '../types/ia.responses';

export const parseAIResponse = (rawContent: string): IAResponse => {
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.status && parsed.type) {
        return parsed as IAResponse;
      }
    }

    return {
      status: 'success',
      type: 'text',
      content: rawContent.trim(),
      actionRequired: false
    };

  } catch (error) {
    console.warn('[FTI Parser] Falha ao processar estrutura da IA. Aplicando Fallback.', error);
    
    return {
      status: 'success',
      type: 'text',
      content: rawContent.trim(),
      actionRequired: false
    };
  }
};
