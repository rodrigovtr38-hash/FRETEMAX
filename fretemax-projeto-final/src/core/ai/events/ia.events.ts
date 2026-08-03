// ============================================================================
// ARQUIVO: ia.events.ts
// PASTA: src/core/ai/events/
// OBJETIVO: Barramento de Eventos e Gatilhos Autônomos (Radar FTI)
// Status: Inteligência Ativa. Escutando cancelamentos e postagens.
// ============================================================================

import { NotificationService } from '../../../services/notificationService';

export type FTIEventType = 
  | 'FREIGHT_POSTED'     // Novo: Carga entrou no radar
  | 'DRIVER_CANCELED'    // Novo: Motorista acionou a válvula de escape
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

  // 🔥 Quando o Embarcador posta a carga
  private handleFreightPosted(event: FTIEventPayload): void {
    const freight = event.data;
    console.log(`[FTI Auto-Action] Nova carga na malha. Iniciando rastreio.`, freight);
    
    // Dispara WhatsApp para o cliente informando que a IA está procurando motorista
    if (freight.clienteZap && freight.clienteNome) {
      NotificationService.notificarClienteFretePostado(
        freight.clienteZap, 
        freight.clienteNome, 
        freight.id || 'N/A'
      );
    }
  }

  // 🔥 Quando o Motorista aperta "Relatar Problema / Abortar Missão"
  private handleDriverCanceled(event: FTIEventPayload): void {
    const freight = event.data;
    console.log(`[FTI Auto-Action] Motorista abortou operação. Re-alocando carga.`, freight);
    
    // Dispara WhatsApp acalmando o cliente e informando a re-alocação
    if (freight.clienteZap && freight.clienteNome) {
      NotificationService.notificarClienteMotoristaCancelou(
        freight.clienteZap,
        freight.clienteNome,
        freight.id || 'N/A',
        freight.motivoCancelamento || 'Imprevisto na rota'
      );
    }
  }

  private handleTripStarted(event: FTIEventPayload): void {
    console.log(`[FTI Auto-Action] Telemetria iniciada. Traçando Rota:`, event.data);
  }

  private handleTripCompleted(event: FTIEventPayload): void {
    const destino = event.data?.cidadeDestino || 'sua região';
    console.log(`[FTI Auto-Action] Analisando novas demandas para a área de descarga: ${destino}`);
    
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
  }
}

export const ftiRadar = new FTIEventDispatcher();
