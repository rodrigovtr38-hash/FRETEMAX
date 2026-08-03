// =========================================================
// NOME DO ARQUIVO: src/components/DriverApp.tsx
// CTO-Log: Resolução Definitiva de Rota e Loop de Telas.
// Status: Bypass de renderização para forçar a montagem da tela de Viagem Ativa.
// =========================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import DriverDashboardLayout, { OperationalFreight } from './driver/dashboard/DriverDashboardLayout';
// 🔥 INJEÇÃO CTO: Importando o componente de viagem ativa para forçar a tela a abrir
import DriverActiveTrip from '../pages/DriverActiveTrip';

interface DriverAppProps {
  freights?: OperationalFreight[];
  activeFreight?: OperationalFreight | null;
  selectedFreight?: OperationalFreight | null;
  isOnline?: boolean;
  loading?: boolean;
  driverCategory?: string;
  driverName?: string;
  onToggleOnline?: (next: boolean) => void;
  onSelectFreight?: (freight: OperationalFreight) => void;
  onCloseFreight?: () => void;
  onAcceptFreight?: (freight: OperationalFreight) => Promise<void> | void;
  onRejectFreight?: (freight: OperationalFreight) => Promise<void> | void;
  children?: React.ReactNode;
}

export default function DriverApp({
  freights = [],
  activeFreight = null,
  selectedFreight = null,
  isOnline = false,
  loading = false,
  driverCategory,
  onToggleOnline,
  onSelectFreight,
  onCloseFreight,
  onAcceptFreight,
  onRejectFreight,
  children,
}: DriverAppProps) {
  const mountedRef = useRef(false);
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const initialize = window.requestAnimationFrame(() => {
      if (mountedRef.current) setRuntimeReady(true);
    });
    return () => { mountedRef.current = false; window.cancelAnimationFrame(initialize); };
  }, []);

  const safeToggleOnline = useCallback((next: boolean) => { onToggleOnline?.(next); }, [onToggleOnline]);

  if (!runtimeReady) return null;

  // 🔥 CTO FIX: Bloqueia o Feed e Força a Tela de Viagem se o Motorista já tem uma corrida ativa
  if (activeFreight && activeFreight.id) {
    return (
      <div className="w-full h-full p-4 relative z-50 animate-in zoom-in duration-500">
         <DriverActiveTrip freteId={activeFreight.id} />
      </div>
    );
  }

  return (
    <>
      <DriverDashboardLayout
        freights={freights}
        selectedFreight={selectedFreight}
        activeFreight={activeFreight}
        isOnline={isOnline}
        loading={loading}
        driverCategory={driverCategory}
        onToggleOnline={safeToggleOnline}
        onSelectFreight={onSelectFreight || (() => {})}
        onCloseFreight={onCloseFreight || (() => {})}
        onAcceptFreight={onAcceptFreight || (() => {})}
        onRejectFreight={onRejectFreight || (() => {})}
      />
      {children}
    </>
  );
}
