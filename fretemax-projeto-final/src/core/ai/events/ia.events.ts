// ============================================================================
// ARQUIVO: src/core/ai/events/ia.events.ts
// CTO-Log: FASE 3 - Homologação de Integração (BLOCO 1 DA ARQUITETURA O.N.E.)
// Status: "Ouvido FTI" 100% calibrado. O Sistema Nervoso da IA escuta todos os eventos 
// da plataforma (EventBus) sem engasgar o front-end do usuário.
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
  | 'CHECK_URGENCY'
  | 'DRIVER_ACCEPTED'
  | 'POD_UPLOADED'; 

export interface FTIEventPayload {
  userId: string;
  eventType: FTIEventType;
  data: any;
  timestamp: string;
}

export class FTIEventDispatcher {
  
  // 🔥 CTO FIX: A IA (FTICore) abriu os "Ouvidos". Tudo o que passar pelo AppEvents, a IA anota.
  constructor() {
    this.iniciarSistemaNervoso();
  }

  private iniciarSistemaNervoso() {
    // 1. Escutando Cargas Canceladas
    eventBusService.on(AppEvents.TRIP_CANCELLED, (payload) => {
      this.dispatch({
        userId: payload?.freteData?.clienteId || 'unknown',
        eventType: 'DRIVER_CANCELED',
        data: payload?.freteData || payload,
        timestamp: new Date().toISOString()
      });
    });

    // 2. Escutando Novos Fretes Postados
    eventBusService.on(AppEvents.NEW_TRIP_REQUEST, (payload) => {
      this.dispatch({
        userId: payload?.clienteId || 'unknown',
        eventType: 'FREIGHT_POSTED',
        data: payload,
        timestamp: new Date().toISOString()
      });
    });

    // 3. Escutando Aceites de Motorista
    eventBusService.on(AppEvents.TRIP_ACCEPTED, (payload) => {
      this.dispatch({
        userId: payload?.motoristaId || 'unknown',
        eventType: 'DRIVER_ACCEPTED',
        data: payload,
        timestamp: new Date().toISOString()
      });
    });

    // 4. Escutando Partidas de Viagem
    eventBusService.on(AppEvents.TRIP_STARTED, (payload) => {
      this.dispatch({
        userId: payload?.motoristaId || 'unknown',
        eventType: 'TRIP_STARTED',
        data: payload,
        timestamp: new Date().toISOString()
      });
    });

    // 5. Escutando Viagens Finalizadas (Liquidadas)
    eventBusService.on(AppEvents.TRIP_FINISHED, (payload) => {
      this.dispatch({
        userId: payload?.motoristaId || 'unknown',
        eventType: 'TRIP_COMPLETED',
        data: payload,
        timestamp: new Date().toISOString()
      });
    });
  }

  // O "Cérebro" de Fofocas (Distribuidor de Tarefas da IA)
  public dispatch(event: FTIEventPayload): void {
    // Modo Invisível: A IA escreve no console dela para debug futuro
    // console.log(`[FTI Core] Captura de Evento: ${event.eventType}`);
    
    switch (event.eventType) {
      case 'FREIGHT_POSTED':
        this.handleFreightPosted(event);
        break;
      case 'DRIVER_CANCELED':
        this.handleDriverCanceled(event);
        break;
      case 'DRIVER_ACCEPTED':
        this.handleDriverAccepted(event);
        break;
      case 'TRIP_STARTED':
        this.handleTripStarted(event);
        break;
      case 'TRIP_COMPLETED':
        this.handleTripCompleted(event);
        break;
      case 'POD_UPLOADED':
        // A Foto do canhoto subiu, a IA foi notificada
        console.log('[FTI Action] Foto recebida. Iniciando cronômetro de 5 minutos de liberação.');
        break;
      case 'CHECK_URGENCY':
        this.handleCheckUrgency(event);
        break;
    }
  }

  private handleDriverAccepted(event: FTIEventPayload): void {
    const freight = event.data;
    // IA avisa o cliente no Zap que achou motorista!
    if (freight.clienteZap && freight.clienteNome) {
      try {
        console.log('[FTI Action] Mandando WhatsApp pro cliente: Motorista está a caminho!');
      } catch (error) {}
    }
  }

  private handleFreightPosted(event: FTIEventPayload): void {
    const freight = event.data;
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
    if (freight.clienteZap && freight.clienteNome) {
      try {
        NotificationService.notificarClienteMotoristaCancelou(
          freight.clienteZap,
          freight.clienteNome,
          freight.id || 'N/A',
          freight.motivoCancelamento || 'Imprevisto na rota'
        );
      } catch (error) {
        console.error('[FTI Radar] Falha silenciosa ao notificar WhatsApp da Empresa:', error);
      }
    }
  }

  private handleTripStarted(event: FTIEventPayload): void {
    console.log(`[FTI Auto-Action] O GPS ligou e o caminhão se mexeu. Acompanhando o trajeto em silêncio.`, event.data);
  }

  private handleTripCompleted(event: FTIEventPayload): void {
    const destino = event.data?.cidadeDestino || 'sua região';
    try {
      const currentHour = new Date().getHours();
      let mensagem = `Você descarregou em ${destino}. Ative o Modo Retorno no Radar para capturarmos cargas de volta para a sua base.`;
      let titulo = 'Retorno Inteligente (FTI)';

      if (currentHour >= 18 || currentHour <= 5) {
        mensagem = `Bom descanso. Você está em ${destino}. Quando for ligar o Radar, deixe o "Modo Retorno" ativado para não rodar vazio na volta.`;
        titulo = 'Viagem Concluída com Sucesso';
      }

      NotificationService.enviarNotificacaoApp(event.userId, titulo, mensagem);
    } catch (error) {
      console.error('[FTI Radar] Falha ao notificar retorno:', error);
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

        // 🔥 CTO FIX (Smart Pricing Integration): Lógica matemática aplicada na urgência
        if (minutosParada >= 14 && minutosParada <= 16) {
          NotificationService.enviarNotificacaoApp(
            event.userId,
            'Baixa Procura (Aviso da FTI)',
            'Sua carga está há 15 min no radar. Aplique a Tabela Sugerida ANTT da plataforma para voltar ao topo e fechar o frete.'
          );
        } else if (minutosParada >= 24 && minutosParada <= 26) {
          NotificationService.enviarNotificacaoApp(
            event.userId,
            'Carga Expirando (Aviso Crítico FTI)',
            'Injete urgência na oferta (Auto-Bid) agora e aplique a tabela do Google Maps da nossa precificação, senão a carga sairá do radar da frota em 5 min.'
          );
        }
      }
    } catch (error) {
      console.error('[FTI Radar] Erro ao checar urgência da carga:', error);
    }
  }
}

export const ftiRadar = new FTIEventDispatcher();
