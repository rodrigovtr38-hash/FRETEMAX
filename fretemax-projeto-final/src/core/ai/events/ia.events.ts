// ============================================================================
// ARQUIVO: src/core/ai/events/ia.events.ts
// CTO-Log: FASE 3 - Homologação de Integração
// Status: "Torre Cega" curada. IA agora lê o AppEvents global e dispara Push de Auto-Bid para o Embarcador.
// ============================================================================

import { NotificationService } from '../../../services/notificationService';
import { eventBusService, AppEvents } from '../../../services/eventBusService';

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
  
  // 🔥 CTO FIX: Fazendo a Torre de Controle "ouvir" o Sistema inteiro (Integração Distribuída)
  constructor() {
    eventBusService.on(AppEvents.TRIP_CANCELLED, (payload) => {
      this.dispatch({
        userId: payload?.freteData?.clienteId || 'unknown',
        eventType: 'DRIVER_CANCELED',
        data: payload?.freteData || payload,
        timestamp: new Date().toISOString()
      });
    });
  }

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
        const criadaEm = freight.createdAt?.toMillis ? freight.createdAt.toMillis() : (freight.criadoEm || agora);
        const minutosParada = (agora - criadaEm) / (1000 * 60);

        // 🔥 CTO FIX (Smart Pricing Integration):
        // Se bater 15 minutos sem motorista pegar, a IA avisa o cliente. 
        // Se bater 25 minutos, avisa de novo com urgência máxima. O TTL vai até 30min.
        if (minutosParada >= 14 && minutosParada <= 16) {
          console.log(`[FTI Scarcity] 15 Minutos. Avisando cliente para Smart Pricing.`);
          NotificationService.enviarNotificacaoApp(
            event.userId,
            'Baixa Procura Identificada',
            'Sua carga está há 15 min no radar. Injete +R$20 de Oferta para voltar ao topo e fechar o frete.'
          );
        } else if (minutosParada >= 24 && minutosParada <= 26) {
          console.log(`[FTI Scarcity] 25 Minutos. Último aviso antes do fim do TTL.`);
          NotificationService.enviarNotificacaoApp(
            event.userId,
            'Carga Expirando em 5 minutos',
            'Injete urgência na oferta (Auto-Bid) agora, senão a carga sairá do radar da frota.'
          );
        }
      }
    } catch (error) {
      console.error('[FTI Radar] Erro ao checar urgência da carga:', error);
    }
  }
}

export const ftiRadar = new FTIEventDispatcher();
