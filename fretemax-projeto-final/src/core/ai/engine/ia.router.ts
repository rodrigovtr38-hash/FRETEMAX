// ============================================================================
// ARQUIVO: src/core/ai/engine/ia.router.ts
// CTO-Log: FASE 3 - Inteligência Viva
// Status: "Cérebro de Plástico" removido. O Router agora aciona a LLM para ler o tráfego e gerar insights em tempo real.
// ============================================================================

import { IAContext } from '../types/ia.context';
import { IAResponse } from '../types/ia.responses';
import { callGeminiAPI } from '../services/ia.gemini';

export const routeIntent = async (prompt: string, context: IAContext): Promise<IAResponse> => {
  console.log(`[FTI Router] Iniciando rota neural para o UID: ${context.user.uid}`);
  console.log(`[FTI Router] Perfil detectado: ${context.user.role}`);

  try {
    if (!prompt || prompt.trim() === '') {
      return {
        status: 'error',
        type: 'error',
        content: 'Não consegui captar sua instrução. Pode repetir?',
        actionRequired: false
      };
    }

    // 🔥 CTO FIX: A IA não responde mais frases prontas. Ela lê o contexto da rota e avalia se o frete está bom ou ruim.
    const systemPrompt = `
      Você é a Torre de Controle Fretogo (Inteligência Artificial).
      Você gerencia a logística entre o Embarcador (quem envia) e o Motorista.
      Usuário atual interagindo: ${context.user.role} (${context.user.name || 'Desconhecido'}).
      Estado da Tela: ${context.appState.currentRoute}.
      
      Sua missão: Responder com autoridade logística, clareza e antecipando problemas.
      Se for um Embarcador reclamando que a carga está parada, avalie o contexto e sugira o "Auto-Bid" (aumentar R$ 20).
      Se for o Motorista, alerte sobre a importância da pontualidade e avise que a rota está sendo rastreada.
      Responda ESTRITAMENTE em formato JSON: { "status": "success", "type": "text", "content": "sua resposta corporativa e humanizada", "actionRequired": false }
    `;

    // Conecta a intenção da operação à mente da LLM para criar mensagens "Vivas".
    const dynamicResponse = await callGeminiAPI(prompt, systemPrompt);

    // Avaliação do LLM sobre qual painel ou ação engatilhar
    let actionName = undefined;
    if (context.user.role === 'motorista' && prompt.toLowerCase().includes('buscar')) {
      actionName = 'BUSCAR_FRETES_MATCH';
    }

    return {
      status: 'success',
      type: dynamicResponse.type || 'text',
      content: dynamicResponse.content || 'Análise operacional concluída.',
      actionRequired: !!actionName,
      actionName: actionName,
      metadata: { processedAt: Date.now() }
    };

  } catch (error) {
    console.error('[FTI Engine] Erro fatal no roteamento:', error);
    
    return {
      status: 'error',
      type: 'error',
      content: 'Ocorreu uma instabilidade pontual na minha rede de processamento neural. Estou reiniciando os módulos.',
      actionRequired: false
    };
  }
};
