// FTI - Serviço de Integração com LLM (Gemini)
// Único ponto de contato com a API de Inteligência Artificial

import { FTI_CONFIG } from '../config/ia.config';
import { IAResponse } from '../types/ia.types';

export const callGeminiAPI = async (prompt: string, systemContext: string): Promise<IAResponse> => {
  // Aqui entrará a lógica real de fetch para a API do Google Gemini
  console.log(`[FTI Services] Conectando ao modelo: ${FTI_CONFIG.modelName}...`);
  
  return {
    status: 'success',
    message: 'Conexão simulada com sucesso. Serviço base estabelecido.'
  };
};
