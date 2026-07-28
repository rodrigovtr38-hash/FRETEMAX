// ============================================================================
// ARQUIVO: ia.validator.ts
// PASTA: src/core/ai/utils/
// OBJETIVO: Escudo de Validação JSON e Sanitização de Dados (Anti-Crash)
// ============================================================================

export interface IAResponseFallback {
  status: 'success' | 'error' | 'action_required';
  type: string;
  content: string;
  actionRequired: boolean;
}

/**
 * Intercepta a resposta bruta do motor neural (Gemini), limpa sujeiras de Markdown
 * e valida o contrato JSON. Se a IA falhar, aciona um Fallback de segurança 
 * para impedir que o aplicativo quebre na mão do motorista.
 */
export const validateAndParseJSON = (rawData: string): IAResponseFallback => {
  try {
    // 1. Sanitização agressiva: Remove blocos de código markdown (```json ... ```)
    const cleanString = rawData.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Parseamento do dado limpo
    const parsed = JSON.parse(cleanString);

    // 3. Validação de Contrato (Obrigatório ter status, type e content)
    if (!parsed.status || !parsed.type || !parsed.content) {
      console.warn('[FTI Validator] Contrato JSON incompleto gerado pela IA. Acionando correção.');
      throw new Error('Missing required JSON fields');
    }

    return parsed as IAResponseFallback;

  } catch (error) {
    console.error('[FTI Critical] Falha ao processar resposta do Motor Neural:', error);
    
    // 4. Mecanismo de Fallback (O que o usuário vê se a IA colapsar)
    return {
      status: 'error',
      type: 'support',
      content: 'Tive uma instabilidade momentânea na conexão com a base. Pode repetir sua solicitação de outra forma?',
      actionRequired: false
    };
  }
};
