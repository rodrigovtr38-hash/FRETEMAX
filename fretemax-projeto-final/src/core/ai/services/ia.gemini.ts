// ============================================================================
// ARQUIVO: src/core/ai/services/ia.gemini.ts
// CTO-Log: FASE 3 - Inteligência Viva
// Status: Conexão atualizada para forçar estrutura JSON e usar diretrizes de sistema nativas.
// ============================================================================

import { FTI_CONFIG } from '../config/ia.config';
import { IAResponse } from '../types/ia.responses';
import { parseAIResponse } from '../engine/ia.parser';

/**
 * Ponto único e exclusivo de contato com a API do Google Gemini.
 * Envia o prompt traduzido, o contexto do sistema e retorna a resposta tratada no contrato FTI.
 */
export const callGeminiAPI = async (
  prompt: string, 
  systemContext: string
): Promise<IAResponse> => {
  console.log(`[FTI Services] Conectando ao modelo neural: ${FTI_CONFIG.modelName}`);

  try {
    if (!FTI_CONFIG.apiKey) {
      console.warn('[FTI Services] Chave da API do Gemini não detectada nas variáveis de ambiente.');
      return {
        status: 'error',
        type: 'error',
        content: 'Serviço FTI indisponível no momento (Chave de API não configurada).',
        actionRequired: false
      };
    }

    // 🔥 CTO FIX: Utilização da propriedade nativa "system_instruction" para maior inteligência de contexto.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${FTI_CONFIG.modelName}:generateContent?key=${FTI_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemContext }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: FTI_CONFIG.temperature || 0.4,
            maxOutputTokens: FTI_CONFIG.maxTokens || 1024,
            response_mime_type: "application/json" // 🔥 CTO FIX: Força a IA a devolver apenas JSON perfeito, blindando o ChatFrete de quebras.
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseAIResponse(rawText);

  } catch (error) {
    console.error('[FTI Services] Falha de comunicação com a rede Gemini:', error);

    return {
      status: 'error',
      type: 'error',
      content: 'Não foi possível estabelecer conexão com o motor neural. Verifique sua rede.',
      actionRequired: false
    };
  }
};
