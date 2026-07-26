// ============================================================================
// ARQUIVO: ia.user.ts
// FASE 4: Tipos e Contratos (TypeScript)
// OBJETIVO: Definir o contrato base de um usuário genérico do sistema FTI
// ============================================================================

/**
 * Níveis de permissão e papéis dentro da plataforma FretoGo.
 */
export type UserRole = 'motorista' | 'empresa' | 'admin';

/**
 * Status da conta do usuário no sistema.
 */
export type UserStatus = 'pendente' | 'homologado' | 'bloqueado' | 'em_analise';

/**
 * Contrato base para qualquer usuário que interaja com a Inteligência.
 * As interfaces específicas de 'Company' (Empresa) e 'Driver' (Motorista) 
 * irão estender (herdar) esta base para evitar duplicação de código.
 */
export interface IABaseUser {
  uid: string;           // ID único do Firebase Auth
  name: string;          // Nome de exibição (Nome ou Razão Social)
  role: UserRole;        // Papel no sistema (quem a IA está atendendo)
  status: UserStatus;    // Situação atual do cadastro
  createdAt: number;     // Timestamp de criação da conta
  lastActive: number;    // Timestamp do último sinal de vida no app
}
