// =========================================================
// NOME DO ARQUIVO: src/services/tripRealtimeListener.ts
// CTO-Log: Fase 6 - Homologação Operacional Distribuída (Liberação Financeira)
// Evolução Fase 10: Reação Ativa ao Rollback do Servidor (DISPONIVEL).
// Evolução Fase 18: Sincronismo Atômico de RTDB e Autoridade Logística (Firestore -> RTDB).
// =========================================================

import {
  eventBusService,
  AppEvents,
} from './eventBusService';

import {
  AppTripState,
  canTransition,
} from '../state/tripStateMachine';

import { dispatchRealtimeService } from './dispatchRealtimeService'; 
import { auth } from '../firebase';

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

      if (
        this.currentState ===
        nextState
      ) {
        return;
      }

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

      // 🔥 CTO FIX: Titularidade da Sessão
      const currentUid = auth.currentUser?.uid;
      const isOwner = currentUid && currentUid === payload.motoristaId;

      switch (nextState) {

        case AppTripState.RESERVADO_AGUARDANDO_PAGAMENTO as any:
          console.log('[CTO-Log] Viagem entrou em RESERVA. Aguardando pagamento do Embarcador.');
          break;

        case AppTripState.DISPONIVEL as any:
          if (this.currentState === AppTripState.RESERVADO_AGUARDANDO_PAGAMENTO as any) {
            if (currentUid) {
              console.log('[CTO-Log] Rollback de Servidor detectado. Desvinculando motorista local via Cleanup Canônico.');
              dispatchRealtimeService.cancelarViagemMotorista(
                currentUid,
                payload.id,
                'Reserva cancelada pelo sistema devido à falha no pagamento do Embarcador.'
              ).catch(err => console.error('[CTO-Log] Erro no cleanup de rollback:', err));
            }
          }
          break;

        case AppTripState.OFERTANDO:
          eventBusService.emit(AppEvents.NEW_TRIP_REQUEST, payload);
          eventBusService.emit(AppEvents.DISPATCH_STARTED, payload);
          break;

        case AppTripState.ACEITO:
          eventBusService.emit(AppEvents.TRIP_ACCEPTED, payload);
          if (payload.id) {
            dispatchRealtimeService.confirmarLiberacaoMotorista(payload.id, payload.motoristaId).catch(err => {
              console.error('[CTO-Log] Falha sistêmica ao tentar liberar o motorista:', err);
            });
          }
          break;

        // 🔥 CTO FIX BLOCO 18: Mapeamento de Transições Logísticas RTDB
        case AppTripState.INDO_COLETA as any:
          if (isOwner) dispatchRealtimeService.iniciarColeta(currentUid);
          break;

        case AppTripState.CHEGOU_COLETA as any:
          if (isOwner) dispatchRealtimeService.chegouColeta(currentUid);
          break;

        case AppTripState.COLETANDO:
          eventBusService.emit(AppEvents.TRIP_COLLECTED, payload);
          if (isOwner) dispatchRealtimeService.iniciouColetando(currentUid);
          break;

        case AppTripState.EM_TRANSPORTE:
          eventBusService.emit(AppEvents.TRIP_IN_PROGRESS, payload);
          eventBusService.emit(AppEvents.TRIP_STARTED, payload);
          if (isOwner) dispatchRealtimeService.iniciarTransporte(currentUid);
          break;

        case AppTripState.FINALIZANDO:
          eventBusService.emit(AppEvents.TRIP_FINISHED, payload);
          if (isOwner) dispatchRealtimeService.finalizarEntrega(currentUid);
          break;

        case AppTripState.ENTREGUE:
          // A limpeza RTDB no ENTREGUE é comandada pela UI que invoca concluirViagemELiberarMotorista().
          // Não aplicamos aqui para evitar chamadas cruzadas de limpeza.
          eventBusService.emit(AppEvents.TRIP_FINISHED, payload);
          break;

        case AppTripState.REDISPATCH:
          eventBusService.emit(AppEvents.REDISPATCH_STARTED, payload);
          break;

        case AppTripState.SEM_MOTORISTA:
          eventBusService.emit(AppEvents.QUEUE_FINISHED, payload);
          break;

        case AppTripState.CANCELADO:
          eventBusService.emit(AppEvents.TRIP_CANCELLED, payload);
          break;

        case AppTripState.EXPIRADO:
          eventBusService.emit(AppEvents.DISPATCH_TIMEOUT, payload);
          break;
      }
    } catch (error) {
      console.error('TRIP REALTIME LISTENER ERROR:', error);
      eventBusService.emit(AppEvents.SYSTEM_ERROR, { origem: 'tripRealtimeListener', error });
    }
  }
}

export const tripRealtimeListener = new TripRealtimeListener();
