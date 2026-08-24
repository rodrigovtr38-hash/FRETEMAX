// =========================================================
// NOME DO ARQUIVO: src/services/tripRealtimeListener.ts
// CTO-Log: Fase 6 - Homologação Operacional Distribuída (Liberação Financeira)
// Evolução Fase 6: Integração de gatilho para destravar o motorista (RESERVA -> ACEITO) somente após o Webhook atuar.
// =========================================================

import {
  eventBusService,
  AppEvents,
} from './eventBusService';

import {
  AppTripState,
  canTransition,
} from '../state/tripStateMachine';

// 🔥 CTO FIX: Importado o serviço de despacho para orquestrar a liberação
import { dispatchRealtimeService } from './dispatchRealtimeService'; 

type TripRealtimePayload = {
  id: string;

  status: AppTripState;

  motoristaId?: string;

  clienteId?: string;

  tracking?: any;
};

class TripRealtimeListener {
  private currentState =
    AppTripState.AGUARDANDO_PAGAMENTO;

  initialize() {
    eventBusService.on(
      AppEvents.TRIP_STATUS_CHANGED,
      this.handleTripUpdate.bind(this),
    );
  }

  private handleTripUpdate(
    payload: TripRealtimePayload,
  ) {
    try {
      if (
        !payload?.status
      ) {
        return;
      }

      const nextState =
        payload.status;

      /*
      ===================================
      IGNORA DUPLICADO
      ===================================
      */

      if (
        this.currentState ===
        nextState
      ) {
        return;
      }

      /*
      ===================================
      VALIDAÇÃO STATE MACHINE
      ===================================
      */

      const isValid =
        canTransition(
          this.currentState,
          nextState,
        );

      if (!isValid) {
        console.warn(
          `INVALID TRIP TRANSITION: ${this.currentState} -> ${nextState}`,
        );

        eventBusService.emit(
          AppEvents.SYSTEM_ERROR,
          {
            origem:
              'tripRealtimeListener',

            currentState:
              this.currentState,

            nextState,
          },
        );

        return;
      }

      console.log(
        `TRIP STATE: ${this.currentState} -> ${nextState}`,
      );

      this.currentState =
        nextState;

      /*
      ===================================
      EVENTS
      ===================================
      */

      switch (nextState) {

        /*
        ================================
        RESERVA (ESCROW PENDENTE)
        ================================
        */
        case AppTripState.RESERVADO_AGUARDANDO_PAGAMENTO as any:
          console.log('[CTO-Log] Viagem entrou em RESERVA. Aguardando pagamento do Embarcador.');
          // A interface reage de forma passiva via onSnapshot ou useTripRealtime, não requer AppEvent isolado aqui.
          break;

        /*
        ================================
        OFERTANDO
        ================================
        */

        case AppTripState.OFERTANDO:

          eventBusService.emit(
            AppEvents.NEW_TRIP_REQUEST,
            payload,
          );

          eventBusService.emit(
            AppEvents.DISPATCH_STARTED,
            payload,
          );

          break;

        /*
        ================================
        ACEITO (ESCROW APROVADO)
        ================================
        */

        case AppTripState.ACEITO:

          eventBusService.emit(
            AppEvents.TRIP_ACCEPTED,
            payload,
          );

          // 🔥 CTO FIX: Liberação Oficial Operacional.
          // Quando a Carga vira ACEITO (via Webhook), o motorista é destravado.
          if (payload.id) {
            dispatchRealtimeService.confirmarLiberacaoMotorista(payload.id, payload.motoristaId).catch(err => {
              console.error('[CTO-Log] Falha sistêmica ao tentar liberar o motorista:', err);
            });
          }

          break;

        /*
        ================================
        REDISPATCH
        ================================
        */

        case AppTripState.REDISPATCH:

          eventBusService.emit(
            AppEvents.REDISPATCH_STARTED,
            payload,
          );

          break;

        /*
        ================================
        SEM MOTORISTA
        ================================
        */

        case AppTripState.SEM_MOTORISTA:

          eventBusService.emit(
            AppEvents.QUEUE_FINISHED,
            payload,
          );

          break;

        /*
        ================================
        COLETANDO
        ================================
        */

        case AppTripState.COLETANDO:

          eventBusService.emit(
            AppEvents.TRIP_COLLECTED,
            payload,
          );

          break;

        /*
        ================================
        TRANSPORTE
        ================================
        */

        case AppTripState.EM_TRANSPORTE:

          eventBusService.emit(
            AppEvents.TRIP_IN_PROGRESS,
            payload,
          );

          eventBusService.emit(
            AppEvents.TRIP_STARTED,
            payload,
          );

          break;

        /*
        ================================
        FINALIZANDO
        ================================
        */

        case AppTripState.FINALIZANDO:

          eventBusService.emit(
            AppEvents.TRIP_FINISHED,
            payload,
          );

          break;

        /*
        ================================
        ENTREGUE
        ================================
        */

        case AppTripState.ENTREGUE:

          eventBusService.emit(
            AppEvents.TRIP_FINISHED,
            payload,
          );

          break;

        /*
        ================================
        CANCELADO
        ================================
        */

        case AppTripState.CANCELADO:

          eventBusService.emit(
            AppEvents.TRIP_CANCELLED,
            payload,
          );

          break;

        /*
        ================================
        EXPIRADO
        ================================
        */

        case AppTripState.EXPIRADO:

          eventBusService.emit(
            AppEvents.DISPATCH_TIMEOUT,
            payload,
          );

          break;
      }
    } catch (error) {

      console.error(
        'TRIP REALTIME LISTENER ERROR:',
        error,
      );

      eventBusService.emit(
        AppEvents.SYSTEM_ERROR,
        {
          origem:
            'tripRealtimeListener',

          error,
        },
      );
    }
  }
}

export const tripRealtimeListener =
  new TripRealtimeListener();
