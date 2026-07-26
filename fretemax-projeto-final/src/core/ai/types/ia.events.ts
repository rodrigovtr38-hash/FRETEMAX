// ============================================================================
// ARQUIVO: ia.events.ts
// FASE 4: Tipos e Contratos (TypeScript)
// OBJETIVO: Definir os contratos dos eventos operacionais que a IA interpreta
// ============================================================================

/**
 * Lista rigorosa de todos os eventos do sistema que a FTI é autorizada a monitorar.
 * Baseado na Constituição Técnica (Fase 7).
 */
export type SystemEventType = 
  | 'empresa_abriu_publicacao'
  | 'empresa_digitou_50'
  | 'empresa_digitou_80'
  | 'empresa_abandonou'
  | 'empresa_publicou'
  | 'motorista_online'
  | 'motorista_offline'
  | 'motorista_homologado'
  | 'motorista_documento_pendente'
  | 'frete_publicado'
  | 'frete_aceito'
  | 'frete_cancelado'
  | 'frete_expirado'
  | 'pagamento_escrow'
  | 'pix_liberado'
  | 'entrega_concluida'
  | 'gps_sem_movimento';

/**
 * Contrato de empacotamento (payload) de um evento disparado pelo aplicativo.
 */
export interface IAEventPayload {
  eventId: string;             // ID único do evento para evitar duplicidade
  eventType: SystemEventType;  // O tipo de evento disparado
  timestamp: number;           // Data e hora exata do evento (America/Sao_Paulo timezone via lógica)
  userId: string;              // ID da Empresa ou Motorista que gerou a ação
  data?: any;                  // Dados complementares (ex: valor do frete, coordenadas GPS)
}
