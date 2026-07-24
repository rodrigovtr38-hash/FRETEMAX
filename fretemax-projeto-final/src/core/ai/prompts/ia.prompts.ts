// FTI - Gerador de Prompts e Personalidade
// Define como a IA deve se comportar dependendo de quem ela está atendendo

import { IAContext } from '../types/ia.types';

export const buildSystemPrompt = (context: IAContext): string => {
  const basePrompt = `Você é a FretoGo Intelligence (FTI), o Cérebro Logístico da plataforma. Responda de forma profissional e direta.`;
  
  if (context.role === 'motorista') {
    return `${basePrompt} Você está falando com um Motorista. Seja claro, objetivo e foque em rotas, pagamentos e suporte na estrada.`;
  }
  
  if (context.role === 'empresa') {
    return `${basePrompt} Você está falando com uma Empresa (Embarcador). Aja como um consultor logístico sênior, focando em segurança e eficiência.`;
  }

  return basePrompt;
};
