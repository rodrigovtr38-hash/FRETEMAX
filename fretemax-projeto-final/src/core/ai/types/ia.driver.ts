// ============================================================================
// ARQUIVO: ia.driver.ts
// PASTA: src/core/ai/types/
// OBJETIVO: Contrato de Dados - Perfil Operacional (Motorista)
// ============================================================================

import { IABaseUser } from './ia.user';

export type VehicleCategory = 'vuc' | 'toco' | 'truck' | 'carreta' | 'carreta_ls' | 'bi_trem' | 'rodotrem';

/**
 * Contrato blindado para Motoristas. Foco em LTV e Risco.
 */
export interface IADriver extends IABaseUser {
  role: 'motorista';
  
  // Compliance
  cpf: string;
  cnh: string;
  
  // Operacional
  vehicleType: VehicleCategory;
  isAvailable: boolean;
  totalTripsCompleted: number;
  
  // Engenharia Financeira & Risco
  reputationScore: number;       // 0.0 a 5.0
  antiFraudScore: number;        // 0 a 100 (Score Serasa/Gerenciadora de Risco)
  walletBalance: number;         // Saldo atual a receber. A IA usa isso para motivar o motorista.
  preferredRegions?: string[];   // Onde ele gosta de rodar (Bom para matching preditivo)
}
