// ============================================================================
// ARQUIVO: ia.company.ts
// FASE 4: Tipos e Contratos (TypeScript)
// OBJETIVO: Definir o contrato específico para usuários do tipo 'Empresa'
// ============================================================================

import { IABaseUser } from './ia.user';

/**
 * Contrato específico para Empresas (Embarcadores).
 * Herda as propriedades básicas de IABaseUser (DRY - Don't Repeat Yourself).
 */
export interface IACompany extends IABaseUser {
  role: 'empresa';             // Força o tipo estrito para empresa
  cnpj: string;                // Documento obrigatório para validação e faturamento
  activeFreightsCount: number; // Quantidade de fretes atualmente publicados ou em rota
  reputationScore: number;     // Nota da empresa na plataforma (0.0 a 5.0)
  totalSpent: number;          // Total financeiro movimentado na plataforma
}
