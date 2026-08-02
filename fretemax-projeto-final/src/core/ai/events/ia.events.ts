// ============================================================================
// ARQUIVO: ia.events.ts
// PASTA: src/core/ai/events/
// OBJETIVO: Barramento de Eventos e Gatilhos Autônomos (Radar FTI)
// Status: Regras de Escassez, Urgência e Agendamento ativadas.
// ============================================================================

import { NotificationService } from '../../../services/notificationService';

export type FTIEventType = 
  | 'TRIP_STARTED' 
  | 'TRIP_COMPLETED' 
  | 'LOCATION_UPDATE' 
  | 'DRIVER_IDLE'
  | 'CHECK_URGENCY'; // Novo gatilho temporal

export interface FTIEventPayload {
  userId: string;
  eventType: FTIEventType;
  data: any;
  timestamp: string;
}

/**
 * Despachante Central de Eventos da IA.
 * Atua de forma silenciosa para prever dores operacionais e aplicar pressão mercadológica.
 */
export class FTIEventDispatcher {
  
  public dispatch(event: FTIEventPayload): void {
    console.log(`[FTI Radar] Evento detectado: ${event.eventType} | Target: ${event.userId}`);
    
    switch (event.eventType) {
      case 'TRIP_STARTED':
        this.handleTripStarted(event);
        break;
      case 'TRIP_COMPLETED':
        this.handleTripCompleted(event);
        break;
      case 'CHECK_URGENCY':
        this.handleCheckUrgency(event);
        break;
      default:
        console.warn(`[FTI Radar] Evento em standby: ${event.eventType}`);
    }
  }

  private handleTripStarted(event: FTIEventPayload): void {
    console.log(`[FTI Auto-Action] Telemetria iniciada. Traçando Rota:`, event.data);
  }

  private handleTripCompleted(event: FTIEventPayload): void {
    const destino = event.data?.cidadeDestino || 'sua região';
    console.log(`[FTI Auto-Action] Analisando novas demandas para a área de descarga: ${destino}`);
    
    // 🔥 CTO AI: Sugestão de Retorno. Se for horário comercial, sugere um frete de volta
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour <= 17) {
      NotificationService.enviarNotificacaoApp(
        event.userId, 
        'Retorno Inteligente', 
        `Você descarregou em ${destino}. Ative o Modo Retorno no Radar para capturarmos cargas de volta para a sua base.`
      );
    }
  }

  private handleCheckUrgency(event: FTIEventPayload): void {
    const freight = event.data;
    if (!freight) return;

    const agora = Date.now();
    const isAgendado = freight.tipoFrete === 'agendado' && freight.dataAgendada;

    // 🔥 REGRA 1: GATILHO DE ESCASSEZ (30 min antes do Agendamento)
    if (isAgendado) {
      const dataAlvo = freight.dataAgendada.toMillis ? freight.dataAgendada.toMillis() : new Date(freight.dataAgendada).getTime();
      const tempoRestanteMinutos = (dataAlvo - agora) / (1000 * 60);

      if (tempoRestanteMinutos > 0 && tempoRestanteMinutos <= 35) {
        console.log(`[FTI Urgency] Gatilho de Agendamento disparado para o frete #${freight.id}`);
        // Isso forçaria uma notificação Push (FCM) ou ZAP via backend. 
        // No Frontend, disparamos a notificação de navegador:
        NotificationService.enviarNotificacaoApp(
          event.userId,
          '⏰ Coleta Iminente!',
          `A coleta do agendamento em ${freight.cidadeOrigem || 'sua região'} está programada para os próximos 30 minutos. Desloque-se.`
        );
      }
    }

    // 🔥 REGRA 2: PRESSÃO DE MERCADO (Carga imediata parada há mais de 10 min)
    if (!isAgendado && freight.status === 'disponivel') {
      const criadaEm = freight.createdAt?.toMillis ? freight.createdAt.toMillis() : agora;
      const minutosParada = (agora - criadaEm) / (1000 * 60);

      if (minutosParada >= 10 && minutosParada <= 15) {
        console.log(`[FTI Scarcity] Carga ${freight.id} parada. Aplicando Tag de Urgência.`);
        // Em um ambiente serveless, isso engatilharia um update no documento mudando 'prioridade' para true.
      }
    }
  }
}

// Singleton exportado para uso global
export const ftiRadar = new FTIEventDispatcher();
