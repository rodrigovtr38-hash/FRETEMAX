// ============================================================================
// ARQUIVO: ia.events.ts
// PASTA: src/core/ai/types/
// OBJETIVO: Tipagem Estrita do Barramento de Eventos Logísticos
// ============================================================================

/**
 * Mapeamento tático do comportamento do usuário.
 */
export type SystemEventType = 
  | 'APP_OPEN'
  | 'DRIVER_ONLINE'
  | 'DRIVER_OFFLINE'
  | 'FREIGHT_SEARCH'
  | 'FREIGHT_ACCEPTED'
  | 'FREIGHT_REJECTED'
  | 'CHECKIN_ORIGIN'
  | 'CHECKOUT_DESTINATION'
  | 'PAYMENT_RELEASED'
  | 'SUPPORT_REQUESTED';

/**
 * Contrato de carga do radar.
 */
export interface IAEventPayload {
  eventId: string;             // UUID para evitar duplicação no Data Lake
  eventType: SystemEventType;  
  timestamp: number;           // ISO Unix
  userId: string;              
  data?: any;                  // Payload flexível (Ex: valor_frete, lat/lng)
  sourceScreen?: string;       // De qual tela o evento disparou?
}
