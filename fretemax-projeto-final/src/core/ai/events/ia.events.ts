// ============================================================================
// ARQUIVO: src/core/ai/events/ia.events.ts
// CTO-Log: FASE 2 - Homologação Operacional
// Status: Bug de Silêncio do Retorno (Noite) erradicado para retenção de mercado. 
// Falha silenciosa no WhatsApp ativada.
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
      let mensagem = `Você descarregou em ${destino}. Ative o Modo Retorno no Radar para capturarmos cargas de volta para a sua base.`;
      let titulo = 'Retorno Inteligente';

      // 🔥 CTO FIX: Não silenciar os alertas de noite. Apenas mudar o tom de voz para agendamento.
      if (currentHour >= 18 || currentHour <= 5) {
        mensagem = `Bom descanso. Você está em ${destino}. Quando for ligar o Radar, deixe o "Modo Retorno" ativado para não rodar vazio na volta.`;
        titulo = 'Viagem Concluída com Sucesso';
      }

      NotificationService.enviarNotificacaoApp(
        event.userId, 
        titulo, 
        mensagem
      );
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
