// ============================================================================
// ARQUIVO: ia.driver.ts
// FASE 4: Tipos e Contratos (TypeScript)
// OBJETIVO: Definir o contrato específico para usuários do tipo 'Motorista'
// ============================================================================

import { IABaseUser } from './ia.user';

/**
 * Categorias de veículos aceitas no ecossistema FretoGo.
 */
export type VehicleCategory = 'vuc' | 'toco' | 'truck' | 'carreta' | 'carreta_ls' | 'bi_trem';

/**
 * Contrato específico para Motoristas.
 * Herda as propriedades básicas de IABaseUser para garantir a consistência do sistema.
 */
export interface IADriver extends IABaseUser {
  role: 'motorista';           // Força o tipo estrito
  cpf: string;                 // Documento obrigatório para compliance e background check
  cnh: string;                 // Registro da CNH
  vehicleType: VehicleCategory; // Categoria do veículo atual do motorista
  isAvailable: boolean;        // Motorista está com app ativo e livre para receber ofertas?
  reputationScore: number;     // Nota do motorista (0.0 a 5.0) - afeta a prioridade no matching
  totalTripsCompleted: number; // Histórico de sucesso na plataforma
}
