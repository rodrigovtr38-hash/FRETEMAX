// ============================================================================
// ARQUIVO: ia.user.ts
// PASTA: src/core/ai/types/
// OBJETIVO: Contrato Base de Usuários - Fundação de Identidade FTI
// ============================================================================

export type UserRole = 'motorista' | 'empresa' | 'admin';
export type UserStatus = 'pendente' | 'em_analise' | 'homologado' | 'bloqueado' | 'suspenso_fraude';

/**
 * Contrato genético absoluto. Todos os perfis herdam daqui.
 */
export interface IABaseUser {
  uid: string;           
  name: string;          
  role: UserRole;        
  status: UserStatus;    
  createdAt: number;     
  lastActive: number;    
  
  // Telemetria de Segurança (Crucial para a IA saber se confia no usuário)
  appVersion?: string;   
  deviceOS?: 'android' | 'ios' | 'web';
  isPhoneVerified: boolean;
}
