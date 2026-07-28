// ============================================================================
// ARQUIVO: ia.events.ts
// PASTA: src/core/ai/events/
// OBJETIVO: Barramento de Eventos e Gatilhos Autônomos (Radar FTI)
// ============================================================================

export type FTIEventType = 
  | 'TRIP_STARTED' 
  | 'TRIP_COMPLETED' 
  | 'LOCATION_UPDATE' 
  | 'DRIVER_IDLE';

export interface FTIEventPayload {
  userId: string;
  eventType: FTIEventType;
  data: any;
  timestamp: string;
}

/**
 * Despachante Central de Eventos.
 * Captura ações do app no background e notifica a IA silenciosamente.
 */
export class FTIEventDispatcher {
  
  public dispatch(event: FTIEventPayload): void {
    console.log(`[FTI Radar] Evento detectado: ${event.eventType} para o usuário ${event.userId}`);
    
    // Switch de roteamento de eventos logísticos
    switch (event.eventType) {
      case 'TRIP_STARTED':
        this.handleTripStarted(event);
        break;
      case 'TRIP_COMPLETED':
        this.handleTripCompleted(event);
        break;
      default:
        console.warn(`[FTI Radar] Evento ignorado ou sem tratativa: ${event.eventType}`);
    }
  }

  private handleTripStarted(event: FTIEventPayload): void {
    // Aqui no futuro injetaremos a chamada para a IA alertar sobre regras da estrada, pedágios, etc.
    console.log(`[FTI Auto-Action] Iniciando monitoramento de viagem:`, event.data);
  }

  private handleTripCompleted(event: FTIEventPayload): void {
    // Gatilho para a IA sugerir o próximo frete na região de descarregamento
    console.log(`[FTI Auto-Action] Viagem concluída. Preparando sugestão de retorno para:`, event.data);
  }
}

// Singleton exportado para uso global
export const ftiRadar = new FTIEventDispatcher();
