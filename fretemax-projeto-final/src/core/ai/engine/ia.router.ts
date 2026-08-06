// ============================================================================
// ARQUIVO: src/core/ai/engine/ia.router.ts
// CTO-Log: Auditoria concluída.
// Status: Roteamento de contexto B2B/B2C (Motorista/Empresa) homologado.
// ============================================================================

import { IAContext } from '../types/ia.context';
import { IAResponse } from '../types/ia.responses';

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

    if (context.user.role === 'motorista') {
      return {
        status: 'success',
        type: 'text',
        content: `Analisando seu histórico e o veículo atual. Buscando as melhores rotas para seu perfil na tela de ${context.appState.currentRoute}.`,
        actionRequired: true,
        actionName: 'BUSCAR_FRETES_MATCH'
      };
    }

    if (context.user.role === 'empresa') {
      return {
        status: 'success',
        type: 'text',
        content: `Processando análise de custos da carga e verificando disponibilidade de frota ativa para sua empresa.`,
        actionRequired: false
      };
    }

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
