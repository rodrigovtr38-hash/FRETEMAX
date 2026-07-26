// ============================================================================
// ARQUIVO: ia.router.ts
// PASTA: engine/
// OBJETIVO: Roteador Cognitivo Vivo - Direciona o prompt com base no perfil
// ============================================================================

import { IAContext } from '../types/ia.context';
import { IAResponse } from '../types/ia.responses';

/**
 * Motor de roteamento ativo da FTI.
 * Analisa o contexto do usuário (Motorista vs Empresa) e o prompt para decidir a ação.
 * Em breve, este módulo acionará o serviço real do Gemini.
 */
export const routeIntent = async (prompt: string, context: IAContext): Promise<IAResponse> => {
  // LOGS DE AUDITORIA (Visível no console do navegador para debug)
  console.log(`[FTI Router] Iniciando rota neural para o UID: ${context.user.uid}`);
  console.log(`[FTI Router] Perfil detectado: ${context.user.role}`);

  try {
    // 1. Validação de Segurança contra requisições vazias
    if (!prompt || prompt.trim() === '') {
      return {
        status: 'error',
        type: 'error',
        content: 'Não consegui captar sua instrução. Pode repetir?',
        actionRequired: false
      };
    }

    // 2. Roteamento Lógico Baseado no Papel (Role-based Routing)
    if (context.user.role === 'motorista') {
      // Lógica focada em quem executa o frete
      return {
        status: 'success',
        type: 'text',
        content: `Analisando seu histórico e o veículo atual. Buscando as melhores rotas para seu perfil na tela de ${context.appState.currentRoute}.`,
        actionRequired: true,
        actionName: 'BUSCAR_FRETES_MATCH'
      };
    }

    if (context.user.role === 'empresa') {
      // Lógica focada em quem paga o frete e publica a carga
      return {
        status: 'success',
        type: 'text',
        content: `Processando análise de custos da carga e verificando disponibilidade de frota ativa para sua empresa.`,
        actionRequired: false
      };
    }

    // Fallback de segurança caso o perfil não seja perfeitamente identificado
    return {
      status: 'success',
      type: 'text',
      content: 'Comando recebido e processado pela matriz FTI.',
      actionRequired: false,
      metadata: { processedAt: Date.now() }
    };

  } catch (error) {
    console.error('[FTI Engine] Erro fatal no roteamento:', error);
    
    return {
      status: 'error',
      type: 'error',
      content: 'Ocorreu um colapso na rede de processamento. Nossa equipe técnica foi notificada.',
      actionRequired: false
    };
  }
};
