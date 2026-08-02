// =========================================================
// NOME DO ARQUIVO: src/components/client/ClientStatusCard.tsx
// CTO-Log: Refatoração do Semáforo de Status. Mensagens vivas baseadas na jornada do motorista.
// =========================================================

import { useState, useEffect } from 'react';
import { Radar, Truck, User, Package, Lock, AlertTriangle, TrendingUp, Timer } from 'lucide-react';

interface ClientStatusCardProps {
  orderData: any;
}

export default function ClientStatusCard({ orderData }: ClientStatusCardProps) {
  const status = orderData?.status;
  const motoristaNome = orderData?.motoristaNome;
  const veiculo = orderData?.veiculo;
  const distancia = orderData?.distancia;
  const valorTotal = orderData?.valorTotal;
  const pinColeta = orderData?.pinColeta;
  const pinEntregas = orderData?.pinEntregas;
  const paradaAtualIndex = orderData?.paradaAtualIndex || 0;
  const multiplasEntregas = orderData?.multiplasEntregas || false;

  // =========================================================
  // GATILHO VISUAL DO FEED (15 MINUTOS)
  // =========================================================
  const TEMPO_FEED_SEGUNDOS = 15 * 60; // 15 minutos
  const [timeLeft, setTimeLeft] = useState(TEMPO_FEED_SEGUNDOS);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'disponivel' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (status !== 'disponivel') {
      // Reseta ou pausa se mudar de status
      setTimeLeft(TEMPO_FEED_SEGUNDOS);
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================
  // TRATAMENTO DE STATUS (SEMÁFORO DE TELEMETRIA)
  // =========================================================
  let safeStatus = 'Sincronizando operação...';
  let statusColor = 'text-cyan-400';
  let bgColor = 'bg-cyan-500/10 border-cyan-500/30';

  if (status === 'aguardando_pagamento') { safeStatus = 'Aguardando Escrow'; }
  else if (status === 'disponivel' || status === 'buscando_motorista') { safeStatus = 'Radar Ativo no Feed'; }
  else if (status === 'sem_motorista' || status === 'expirado') { safeStatus = 'Tempo Esgotado'; statusColor = 'text-amber-400'; bgColor = 'bg-amber-500/10 border-amber-500/30'; }
  else if (status === 'cancelado') { safeStatus = 'Operação Abortada'; statusColor = 'text-red-400'; bgColor = 'bg-red-500/10 border-red-500/30'; }
  else if (status === 'aceito') { safeStatus = 'Motorista a Caminho'; statusColor = 'text-blue-400'; bgColor = 'bg-blue-500/10 border-blue-500/30'; }
  else if (status === 'indo_coleta') { safeStatus = 'Indo para Coleta'; statusColor = 'text-blue-400'; bgColor = 'bg-blue-500/10 border-blue-500/30'; }
  else if (status === 'chegou_coleta') { safeStatus = 'Aguardando no Local'; statusColor = 'text-indigo-400'; bgColor = 'bg-indigo-500/10 border-indigo-500/30'; }
  else if (status === 'coletando') { safeStatus = 'Carregando Veículo'; statusColor = 'text-amber-400'; bgColor = 'bg-amber-500/10 border-amber-500/30'; }
  else if (status === 'em_transporte') { safeStatus = 'Carga em Trânsito'; statusColor = 'text-emerald-400'; bgColor = 'bg-emerald-500/10 border-emerald-500/30'; }
  else if (status === 'finalizando' || status === 'entregue' || status === 'finalizado') { safeStatus = 'Entrega Concluída'; statusColor = 'text-emerald-400'; bgColor = 'bg-emerald-500/10 border-emerald-500/30'; }

  const isDataReady = typeof distancia === 'number' && distancia > 0 && typeof valorTotal === 'number' && valorTotal > 0;
  const displayDistance = isDataReady ? `${distancia.toFixed(1)} km` : 'Calculando...';
  const displayPrice = isDataReady ? `R$ ${valorTotal.toFixed(2).replace('.', ',')}` : '---';

  const showWarning = status === 'sem_motorista' || status === 'expirado';

  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">

      {/* HEADER DE STATUS & RELÓGIO */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-[1.5rem] border ${bgColor}`}>
            {showWarning ? (
              <AlertTriangle className="h-7 w-7 text-amber-400" />
            ) : (
              <Radar className={`h-7 w-7 ${statusColor} ${['disponivel', 'aguardando_pagamento'].includes(status) ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            )}
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusColor}`}>
              Torre de Monitoramento
            </p>
            <h2 className={`text-xl md:text-2xl font-black uppercase italic tracking-tight mt-0.5 ${statusColor}`}>
              {safeStatus}
            </h2>
          </div>
        </div>

        {/* RELÓGIO VISUAL (Aparece apenas quando a carga está no Feed) */}
        {status === 'disponivel' && (
          <div className="flex items-center gap-3 bg-slate-950/80 border border-cyan-500/20 px-4 py-2.5 rounded-2xl">
            <Timer className="text-cyan-400 animate-pulse" size={20} />
            <div>
              <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Tempo de Exposição</p>
              <p className="text-lg font-mono font-black text-cyan-400 leading-none">{formatTime(timeLeft)}</p>
            </div>
          </div>
        )}
      </div>

      {/* UPSELL / RETENÇÃO */}
      {showWarning && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 flex items-start gap-4">
           <TrendingUp className="text-amber-400 shrink-0 mt-0.5" size={20} />
           <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">Dica de Mercado</p>
              <p className="text-xs font-bold text-amber-100/80 leading-relaxed">
                Nenhum parceiro aceitou a carga neste valor dentro do tempo limite. Feche este pedido e poste novamente com uma tarifa maior para atrair a frota rapidamente.
              </p>
           </div>
        </div>
      )}

      {/* DETALHES OPERACIONAIS */}
      <div className="space-y-4">

        {/* MOTORISTA */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4 flex items-center justify-between transition-colors hover:bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Profissional Designado</span>
              <p className={`text-sm font-bold truncate mt-0.5 ${showWarning ? 'text-amber-400/80' : 'text-white'}`}>
                {motoristaNome || (showWarning ? 'Aguardando republicação' : 'Buscando parceiros no raio...')}
              </p>
            </div>
          </div>
        </div>

        {/* VEÍCULO */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4 flex items-center gap-3 transition-colors hover:bg-slate-950/80">
          <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400 shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Especificação Exigida</span>
            <p className="text-sm font-bold text-white uppercase mt-0.5">
              {veiculo?.replace('_', ' ') || 'Analisando matriz...'}
            </p>
          </div>
        </div>

        {/* ROTA E FINANCEIRO */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4 flex items-center justify-between transition-colors hover:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-400 shrink-0">
              <Package size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                Resumo Logístico {multiplasEntregas && <span className="text-cyan-400 font-black ml-1 bg-cyan-500/10 px-1 py-0.5 rounded">MULTI-DROP</span>}
              </span>
              <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                {displayDistance} <span className="text-slate-600">|</span> <span className="text-green-400 font-black">{displayPrice}</span>
              </p>
            </div>
          </div>
        </div>

        {/* PINS DE SEGURANÇA BANCÁRIA */}
        {(pinColeta || (pinEntregas && pinEntregas.length > 0)) && (
          <div className="rounded-[1.5rem] border border-cyan-500/30 bg-cyan-950/30 p-5 mt-6 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2 mb-4">
              <Lock size={14} /> Chaves de Liberação (PIN)
            </p>
            <div className="flex flex-wrap gap-4">
              {pinColeta && (
                <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-white/10 flex-1 min-w-[140px] shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block mb-1">Liberação Coleta</span>
                  <span className="font-mono font-black text-xl text-white tracking-[0.2em] block">{pinColeta}</span>
                </div>
              )}
              {pinEntregas && pinEntregas.length > 0 && (
                <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-emerald-500/20 flex-1 min-w-[140px] shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest block mb-1">
                    Liberação Escrow {multiplasEntregas ? `(Drop ${paradaAtualIndex + 1})` : ''}
                  </span>
                  <span className="font-mono font-black text-xl text-emerald-400 tracking-[0.2em] block">
                    {pinEntregas[paradaAtualIndex] || pinEntregas[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
