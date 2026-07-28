// ============================================================================
// ARQUIVO: ia.company.ts
// PASTA: src/core/ai/types/
// OBJETIVO: Contrato de Dados (TypeScript) - Perfil Corporativo (Embarcador)
// ============================================================================

import { IABaseUser } from './ia.user';

/**
 * Contrato blindado para Empresas (Embarcadores/Transportadoras).
 * Este payload é a base para a IA entender o poder de barganha e o 
 * LTV (Lifetime Value) do cliente no ecossistema SaaS.
 */
export interface IACompany extends IABaseUser {
  role: 'empresa';
  
  // Identificação e Compliance
  cnpj: string;
  isVerified: boolean; // Selo de confiança antifraude para liberar motoristas premium
  
  // Métricas de Escala e Engajamento Logístico
  activeFreightsCount: number;
  historicalFreightsCompleted: number; // Volume de sucesso na plataforma
  reputationScore: number; // 0.0 a 5.0 (Afeta diretamente o algoritmo de roteamento)
  
  // Lógica Financeira (Senioridade SaaS)
  totalSpent: number; // Volume Geral de Vendas (GMV) transacionado pela empresa
  billingTier: 'FREE' | 'PRO' | 'ENTERPRISE'; // Nível de assinatura. A IA prioriza suporte Enterprise.
  
  // Indicadores de Negociação
  preferredRoutes?: string[]; // Eixos logísticos de maior atuação (Ouro para remarketing no Google Ads)
  averagePaymentTermsDays?: number; // Prazos padrão (ex: 15, 30 dias). A IA usa para calcular propostas.
}
