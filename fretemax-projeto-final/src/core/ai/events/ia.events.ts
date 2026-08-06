// ============================================================================
// ARQUIVO: src/core/ai/events/ia.events.ts
// CTO-Log: Blindagem de Eventos Assíncronos.
// Status: Try-catch injetado ao redor do NotificationService para garantir que falhas no WhatsApp não congelem a Máquina de Estados da carga.
// ============================================================================

import { NotificationService } from '../../../services/notificationService';

export type FTIEventType = 
  | 'FREIGHT_POSTED'     
  | 'DRIVER_CANCELED'    
  | 'TRIP_STARTED' 
  | 'TRIP_COMPLETED' 
  | 'LOCATION_UPDATE' 
  | 'DRIVER_IDLE'
  | 'CHECK_URGENCY'; 

export interface FTIEventPayload {
  userId: string;
  eventType: FTIEventType;
  data: any;
  timestamp: string;
}

export class FTIEventDispatcher {
  
  public dispatch(event: FTIEventPayload): void {
    console.log(`[FTI Radar] Evento detectado: ${event.eventType} | Target: ${event.userId}`);
    
    switch (event.eventType) {
      case 'FREIGHT_POSTED':
        this.handleFreightPosted(event);
        break;
      case 'DRIVER_CANCELED':
        this.handleDriverCanceled(event);
        break;
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

  private handleFreightPosted(event: FTIEventPayload): void {
    const freight = event.data;
    console.log(`[FTI Auto-Action] Nova carga na malha. Iniciando rastreio.`, freight);
    
    if (freight.clienteZap && freight.clienteNome) {
      try {
        NotificationService.notificarClienteFretePostado(
          freight.clienteZap, 
          freight.clienteNome, 
          freight.id || 'N/A'
        );
      } catch (error) {
        console.error('[FTI Radar] Falha silenciosa ao notificar WhatsApp da Empresa:', error);
      }
    }
  }

  private handleDriverCanceled(event: FTIEventPayload): void {
    const freight = event.data;
    console.log(`[FTI Auto-Action] Motorista abortou operação. Re-alocando carga.`, freight);
    
    if (freight.clienteZap && freight.clienteNome) {
      try {
        NotificationService.notificarClienteMotoristaCancelou(
          freight.clienteZap,
          freight.clienteNome,
          freight.id || 'N/A',
          freight.motivoCancelamento || 'Imprevisto na rota'
        );
      } catch (error) {
        console.error('[FTI Radar] Falha silenciosa ao notificar WhatsApp da Empresa sobre cancelamento:', error);
      }
    }
  }

  private handleTripStarted(event: FTIEventPayload): void {
    console.log(`[FTI Auto-Action] Telemetria iniciada. Traçando Rota:`, event.data);
  }

  private handleTripCompleted(event: FTIEventPayload): void {
    const destino = event.data?.cidadeDestino || 'sua região';
    console.log(`[FTI Auto-Action] Analisando novas demandas para a área de descarga: ${destino}`);
    
    try {
      const currentHour = new Date().getHours();
      if (currentHour >= 6 && currentHour <= 17) {
        NotificationService.enviarNotificacaoApp(
          event.userId, 
          'Retorno Inteligente', 
          `Você descarregou em ${destino}. Ative o Modo Retorno no Radar para capturarmos cargas de volta para a sua base.`
        );
      }
    } catch (error) {
      console.error('[FTI Radar] Falha silenciosa ao notificar retorno do Motorista:', error);
    }
  }

  private handleCheckUrgency(event: FTIEventPayload): void {
    const freight = event.data;
    if (!freight) return;

    const agora = Date.now();
    const isAgendado = freight.tipoFrete === 'agendado' && freight.dataAgendada;

    try {
      if (isAgendado) {
        const dataAlvo = freight.dataAgendada.toMillis ? freight.dataAgendada.toMillis() : new Date(freight.dataAgendada).getTime();
        const tempoRestanteMinutos = (dataAlvo - agora) / (1000 * 60);

        if (tempoRestanteMinutos > 0 && tempoRestanteMinutos <= 35) {
          NotificationService.enviarNotificacaoApp(
            event.userId,
            '⏰ Coleta Iminente!',
            `A coleta do agendamento em ${freight.cidadeOrigem || 'sua região'} está programada para os próximos 30 minutos. Desloque-se.`
          );
        }
      }

      if (!isAgendado && freight.status === 'disponivel') {
        const criadaEm = freight.createdAt?.toMillis ? freight.createdAt.toMillis() : agora;
        const minutosParada = (agora - criadaEm) / (1000 * 60);

        if (minutosParada >= 25 && minutosParada <= 30) {
          console.log(`[FTI Scarcity] Carga parada há quase 30 minutos. Tempo limite de Feed atingido.`);
        }
      }
    } catch (error) {
      console.error('[FTI Radar] Erro ao checar urgência da carga:', error);
    }
  }
}

export const ftiRadar = new FTIEventDispatcher();
