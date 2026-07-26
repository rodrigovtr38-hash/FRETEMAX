// ============================================================================
// ARQUIVO: ia.gemini.ts
// PASTA: services/
// OBJETIVO: Serviço principal de conexão REST/SDK com a API do Google Gemini
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
    // 1. Validação da chave de API
    if (!FTI_CONFIG.apiKey) {
      console.warn('[FTI Services] Chave da API do Gemini não detectada nas variáveis de ambiente.');
      return {
        status: 'error',
        type: 'error',
        content: 'Serviço FTI indisponível no momento (Chave de API não configurada).',
        actionRequired: false
      };
    }

    // 2. Requisição HTTP real para a API do Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${FTI_CONFIG.modelName}:generateContent?key=${FTI_CONFIG.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemContext}\n\nInstrução do Usuário: ${prompt}` }]
            }
          ],
          generationConfig: {
            temperature: FTI_CONFIG.temperature || 0.7,
            maxOutputTokens: FTI_CONFIG.maxTokens || 1024,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 3. Processa a resposta através do nosso Parser oficial
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
