// ============================================================================
// ARQUIVO: src/core/ai/components/FTIChat.tsx
// CTO-Log: Refinamento de Tipagem.
// Status: Import de contexto corrigido para evitar falha de renderização na compilação.
// ============================================================================

import React, { useState } from 'react';
import { useFTI } from '../hooks/useFTI';
// 🔥 CTO FIX: Caminho de importação corrigido para o diretório de tipos unificado.
import { IAContext } from '../types/ia.context';

interface FTIChatProps {
  context: IAContext;
}

export const FTIChat: React.FC<FTIChatProps> = ({ context }) => {
  const { interactWithAI, isProcessing } = useFTI(context);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'fti', text: string}[]>([]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    const response = await interactWithAI(userText);

    if (response && response.content) {
      setMessages(prev => [...prev, { role: 'fti', text: response.content }]);
    }
  };

  return (
    <div className="flex flex-col h-96 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
      
      <div className="bg-slate-900 text-white p-4 font-bold text-lg flex justify-between items-center border-b-4 border-blue-600">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>Central FTI</span>
        </div>
        {isProcessing && <span className="text-xs text-slate-300 font-normal tracking-widest">PROCESSANDO...</span>}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <p className="text-slate-600 text-sm font-medium">
              Operador conectado: {context.name || 'Usuário'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Como posso otimizar sua operação de transporte hoje?
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Comando para a base..."
          disabled={isProcessing}
          className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={isProcessing || !input.trim()}
          className="bg-slate-900 text-white px-5 py-3 rounded-lg font-bold text-sm tracking-wide disabled:opacity-50 hover:bg-slate-800 transition-colors"
        >
          ENVIAR
        </button>
      </div>
    </div>
  );
};
