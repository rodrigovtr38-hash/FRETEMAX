// ============================================================================
// ARQUIVO: src/core/ai/components/FTIWidget.tsx
// CTO-Log: FASE 2 - Homologação Operacional.
// Status: Componente Visual validado. Tratativa de Fallback passivo segura.
// ============================================================================

import React from 'react';
import { useFTI } from '../hooks/useFTI';
import { IAContext } from '../types/ia.context'; // Caminho realinhado.

interface FTIWidgetProps {
  context?: IAContext;
  onClick?: () => void;
}

const FTIWidget: React.FC<FTIWidgetProps> = ({ context, onClick }) => {
  // Fallback de segurança: Se o componente for chamado sem contexto (ex: usuário deslogado),
  // assumimos o perfil de visitante genérico para a IA não falhar.
  const fallbackContext: IAContext = context || {
    user: {
      uid: 'guest-user',
      role: 'empresa',
      name: 'Visitante'
    },
    appState: {
      currentRoute: 'home',
      activeFreight: null
    }
  };

  // Conecta ao nosso motor neural para saber se a IA está "pensando"
  const { isProcessing } = useFTI(fallbackContext);

  // Ação padrão caso onClick não seja fornecido
  const handleClick = onClick || (() => console.log('FTI Widget: Clique registrado.'));

  return (
    <div 
      onClick={handleClick}
      className="fixed bottom-6 right-6 cursor-pointer flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl hover:scale-105 transition-transform border border-slate-700 z-50"
    >
      {/* Indicador Visual de Status (LED Digital) */}
      <div className="relative flex h-3 w-3">
        {isProcessing ? (
           <>
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
           </>
        ) : (
           <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
        )}
      </div>
      
      {/* Texto de Status */}
      <span className="font-bold text-sm tracking-wide">
        {isProcessing ? 'FTI Analisando...' : 'FTI Online'}
      </span>
    </div>
  );
};

export default FTIWidget;
