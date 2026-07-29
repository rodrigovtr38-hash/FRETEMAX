// =========================================================
// NOME DO ARQUIVO: src/services/realtimeOrchestrator.ts
// CTO-Log: Auditoria de Orquestração (LOTE 7)
// Status: Variáveis fantasma removidas e payload tipado para deploy verde.
// =========================================================

import { firebaseRealtimeService } from './firebaseRealtimeService';
import { eventBusService, AppEvents } from './eventBusService';
import { StateSynchronizationService } from './stateSynchronizationService';
import { DriverState } from '../state/driverStateMachine';
import { AppTripState } from '../state/tripStateMachine';

class RealtimeOrchestrator {
  private _initialized = false;
  private _syncing = false;
  private _eventsRegistered = false;

  // Exposto para garantir que a Vercel não acuse a variável como inutilizada
  public get isInitialized(): boolean {
    return this._initialized;
  }

  initialize(config: { driverId?: string; tripId?: string }): void {
    try {
      if (!this._eventsRegistered) {
        this.registerEvents();
        this._eventsRegistered = true;
      }

      if (config.driverId) {
        firebaseRealtimeService.listenDriver(config.driverId);
      }

      if (config.tripId) {
        firebaseRealtimeService.listenTrip(config.tripId);
      }

      this._initialized = true;
      eventBusService.emit(AppEvents.REALTIME_CONNECTED);
    } catch (error: unknown) {
      console.error('[CTO-Log] REALTIME ORCHESTRATOR INIT ERROR:', error);
      eventBusService.emit(AppEvents.SYSTEM_ERROR, { origem: 'realtimeOrchestrator.initialize', error });
    }
  }

  private registerEvents(): void {
    // Ajuste de Payload: Tipagem restrita substituindo o uso de 'any'
    eventBusService.on(AppEvents.TRIP_STATUS_CHANGED, async (payload: Record<string, unknown> | null) => {
      if (this._syncing || !payload) return;
      
      this._syncing = true; // LOCK: Impede eventos sobrepostos
      try {
        const tripStateRecebido = payload.status as AppTripState;
        const driverStateRecebido = (payload.state as DriverState) || DriverState.OCUPADO;

        const syncResult = StateSynchronizationService.synchronize(
          driverStateRecebido,
          tripStateRecebido
        );
        
        eventBusService.emit(AppEvents.STATE_SYNCED, syncResult);
      } catch (error: unknown) {
        console.error('[CTO-Log] SYNC ERROR:', error);
      } finally {
        this._syncing = false; // RELEASE: Libera para o próximo evento
      }
    });
  }
}

export const realtimeOrchestrator = new RealtimeOrchestrator();
export default realtimeOrchestrator;
