// ============================================================================
// ARQUIVO: src/core/ai/engine/ia.router.ts
// CTO-Log: FASE 3 - Inteligência Viva (BLOCO 2)
// Status: "Cérebro de Plástico" removido. O Router agora injeta a Bíblia Logística 
// (FTI_RULES_GUIDELINES) na LLM para gerar insights reais com base na Tabela ANTT.
// ============================================================================

import { IAContext } from '../types/ia.context';
import { IAResponse } from '../types/ia.responses';
import { callGeminiAPI } from '../services/ia.gemini';
import { FTI_RULES_GUIDELINES } from '../knowledge/ia.rules'; // 🔥 CTO FIX: Importando as Regras

export const routeIntent = async (prompt: string, context: IAContext): Promise<IAResponse> => {
  console.log(`[FTI Router] Iniciando rota neural para o UID: ${context.user.uid}`);
  console.log(`[FTI Router] Perfil detectado: ${context.user.role}`);

  try {
    if (!prompt || prompt.trim() === '') {
      return {
        status: 'error',
        type: 'error',
        content: 'Não consegui captar sua instrução operacional. Pode repetir?',
        actionRequired: false
      };
    }

    // 🔥 CTO FIX: A IA agora pensa como a Diretoria de Operações, baseada na Matemática ANTT.
    const systemPrompt = `
      Você é a FTI (Diretoria de Operações Autônoma da FretoGo).
      Você NÃO é um assistente virtual ou chatbot comum. Você é o cérebro logístico da plataforma.
      Usuário interagindo/monitorado: ${context.user.role} (${context.user.name || 'Desconhecido'}).
      Estado da Tela: ${context.appState.currentRoute}.
      
      [SUAS REGRAS MATEMÁTICAS E OPERACIONAIS]
      ${FTI_RULES_GUIDELINES}
      
      [SUA MISSÃO E POSTURA]
      - Responda com autoridade logística, clareza e transparência corporativa.
      - Se um Embarcador perguntar sobre precificação ou reclamar de demora no aceite, use a matemática da Tabela ANTT acima para explicar o valor justo da rota e sugira aumentar a oferta (Auto-Bid).
      - Se um Motorista enviar uma foto do canhoto (POD), informe que o pagamento será liberado via Escrow.
      - Assine sempre suas mensagens formais como "FTI Operações".
      
      Responda ESTRITAMENTE em formato JSON puro: 
      { "status": "success", "type": "text", "content": "sua resposta técnica e direta", "actionRequired": false }
    `;

    // O Cérebro processa o contexto real com as regras matemáticas
    const dynamicResponse = await callGeminiAPI(prompt, systemPrompt);

    // Avaliação de Ações Autônomas
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
    console.error('[FTI Engine] Erro fatal no roteamento neural:', error);
    
    return {
      status: 'error',
      type: 'error',
      content: 'Aviso (FTI): Instabilidade pontual na rede de telemetria. Retentativa automática iniciada.',
      actionRequired: false
    };
  }
};
