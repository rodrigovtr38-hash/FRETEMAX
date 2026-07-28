// ============================================================================
// ARQUIVO: useFTI.ts
// PASTA: src/core/ai/hooks/
// OBJETIVO: Hook React de Orquestração da Inteligência Artificial no Front-End
// ============================================================================

import { useState, useCallback } from 'react';
import { callGeminiAPI } from '../services/ia.gemini';
import { ftiMemory } from '../memory/ia.memory';
import { buildBaseSystemInstruction, buildUserContext, IAContext } from '../prompts/ia.prompts';
import { validateAndParseJSON } from '../utils/ia.validator';

export const useFTI = (context: IAContext) => {
  // Estado que controla se a IA está "pensando", útil para travar botões na interface
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Função principal que a interface (UI) chama quando o motorista digita algo.
   */
  const interactWithAI = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return null;
    
    setIsProcessing(true);

    try {
      // 1. Salva a mensagem do usuário na memória RAM local
      ftiMemory.addMessage(context.userId, 'user', userMessage);

      // 2. Monta as diretrizes absolutas e injeta quem é o usuário atual
      const systemContext = buildBaseSystemInstruction() + '\n' + buildUserContext(context, userMessage);

      // 3. Dispara a requisição para o motor neural (Gemini) na pasta services
      const rawResponse = await callGeminiAPI(
         userMessage,
         systemContext
      );

      // 4. Escudo ativado: Limpa sujeira de formatação e valida o contrato JSON obrigatório
      const safeData = validateAndParseJSON(rawResponse.content);

      // 5. Salva a resposta limpa e validada na memória da IA
      ftiMemory.addMessage(context.userId, 'model', safeData.content);

      // 6. Devolve o JSON perfeito para o Front-End renderizar
      return safeData;

    } catch (error) {
      console.error('[FTI Hook] Colapso na requisição:', error);
      
      // Fallback de segurança impenetrável para não estourar a tela do motorista
      return {
        status: 'error',
        type: 'support',
        content: 'Falha momentânea de comunicação com a base de operações. Tente novamente em instantes.',
        actionRequired: false
      };
    } finally {
      setIsProcessing(false);
    }
  }, [context]);

  return {
    interactWithAI,
    isProcessing
  };
};
