// =========================================================
// NOME DO ARQUIVO: src/services/firebaseRealtimeService.ts
// CTO-Log: Otimização de Transmissão Firestore - LOTE 4
// Correção (Bloco 5): Sincronizado para a coleção oficial 'motoristas_cadastros' evitando o bug do congelamento em tempo real.
// =========================================================

import { doc, onSnapshot, updateDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { eventBusService, AppEvents } from './eventBusService';
import { DriverState } from '../state/driverStateMachine';

class FirebaseRealtimeService {
  private listeners = new Map<string, Unsubscribe>();
  private activeKeys = new Set<string>();

  private emitConnected() {
    eventBusService.emit(AppEvents.REALTIME_CONNECTED);
  }

  private emitDisconnected() {
    eventBusService.emit(AppEvents.REALTIME_DISCONNECTED);
  }

  private registerListener(key: string, unsubscribe: Unsubscribe) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!();
    }
    this.listeners.set(key, unsubscribe);
    this.activeKeys.add(key);
  }

  hasListener(key: string) {
    return this.activeKeys.has(key);
  }

  listenDriver(driverId: string) {
    try {
      if (!driverId) return;
      const key = `driver_${driverId}`;
      if (this.hasListener(key)) return;

      // 🔥 CTO FIX: Coleção sincronizada com a Fonte de Verdade
      const driverRef = doc(db, 'motoristas_cadastros', driverId);

      const unsubscribe = onSnapshot(
        driverRef,
        snapshot => {
          if (!snapshot.exists()) return;
          const data = { id: snapshot.id, ...snapshot.data() };
          this.emitConnected();
          eventBusService.emit(AppEvents.DRIVER_STATUS_CHANGED, data);
        },
        error => {
          console.error('[CTO-Log] REALTIME DRIVER ERROR:', error);
          this.emitDisconnected();
        }
      );

      this.registerListener(key, unsubscribe);
    } catch (error) {
      console.error('[CTO-Log] ERRO LISTEN DRIVER:', error);
    }
  }

  listenTrip(tripId: string) {
    try {
      if (!tripId) return;
      const key = `trip_${tripId}`;
      if (this.hasListener(key)) return;

      const tripRef = doc(db, 'fretes', tripId);

      const unsubscribe = onSnapshot(
        tripRef,
        snapshot => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();
          
          eventBusService.emit(AppEvents.TRIP_STATUS_CHANGED, {
            id: snapshot.id,
            tripState: data.status,
            driverState: data.driverState || DriverState.ONLINE, 
            ...data,
          });

          this.emitConnected();
        },
        error => {
          console.error('[CTO-Log] REALTIME TRIP ERROR:', error);
          this.emitDisconnected();
        }
      );

      this.registerListener(key, unsubscribe);
    } catch (error) {
      console.error('[CTO-Log] ERRO LISTEN TRIP:', error);
    }
  }

  async updateDriverRealtime(driverId: string, payload: Record<string, any>) {
    try {
      if (!driverId) return;
      // 🔥 CTO FIX: Coleção sincronizada com a Fonte de Verdade
      const driverRef = doc(db, 'motoristas_cadastros', driverId);
      await updateDoc(driverRef, { ...payload, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('[CTO-Log] ERRO UPDATE DRIVER:', error);
    }
  }

  async updateTripRealtime(tripId: string, payload: Record<string, any>) {
    try {
      if (!tripId) return;
      const tripRef = doc(db, 'fretes', tripId);
      await updateDoc(tripRef, { ...payload, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('[CTO-Log] ERRO UPDATE TRIP:', error);
    }
  }

  stopListener(key: string) {
    const listener = this.listeners.get(key);
    if (!listener) return;
    listener(); 
    this.listeners.delete(key);
    this.activeKeys.delete(key);
  }

  stopDriverListener(driverId: string) {
    this.stopListener(`driver_${driverId}`);
  }

  stopTripListener(tripId: string) {
    this.stopListener(`trip_${tripId}`);
  }

  disconnectScoped(config: { driverId?: string; tripId?: string }) {
    if (config.driverId) this.stopDriverListener(config.driverId);
    if (config.tripId) this.stopTripListener(config.tripId);
  }
}

export const firebaseRealtimeService = new FirebaseRealtimeService();
