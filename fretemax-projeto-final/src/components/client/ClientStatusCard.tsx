// =========================================================
// NOME DO ARQUIVO: src/components/client/ClientStatusCard.tsx
// CTO-Log: Torre de Controle Ativa injetada. 
// Status: Painel agora exibe ETA, Linha do tempo de operação e Avatar (quando o motorista existe).
// =========================================================

import { useState, useEffect } from 'react';
import { Radar, Truck, User, Package, Lock, AlertTriangle, TrendingUp, Timer, Navigation, Star } from 'lucide-react';

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

  const TEMPO_FEED_SEGUNDOS = 15 * 60; 
  const [timeLeft, setTimeLeft] = useState(TEMPO_FEED_SEGUNDOS);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'disponivel' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (status !== 'disponivel') {
      setTimeLeft(TEMPO_FEED_SEGUNDOS);
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  // ETA Mock (Poderia vir do banco no futuro via Google Matrix)
  const etaMinutes = isDataReady ? Math.max(10, Math.round(distancia * 1.5)) : 0;

  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
      
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

      <div className="space-y-4">
        
        {/* 🔥 CTO FIX: Torre de Controle Expandida (Rastreio) */}
        {motoristaNome && (
          <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-slate-950/80">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <User size={24} className="text-blue-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-slate-900">
                  5.0 <Star size={8} fill="currentColor"/>
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Profissional Designado</span>
                <p className="text-lg font-black truncate text-white leading-tight">
                  {motoristaNome}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {veiculo?.replace('_', ' ') || 'Veículo'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* ETA Real-Time View */}
            {['aceito', 'indo_coleta', 'em_transporte'].includes(status) && (
              <div className="w-full md:w-auto bg-slate-900 rounded-xl p-3 border border-white/5 flex items-center gap-3 shrink-0">
                <Navigation size={18} className="text-blue-400 animate-pulse" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estimativa (ETA)</p>
                  <p className="text-sm font-black text-white">{etaMinutes} min restantes</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!motoristaNome && (
          <div className="rounded-2xl border border-white/5 bg-slate-950/50 p-4 flex items-center justify-between transition-colors hover:bg-slate-950/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Profissional Designado</span>
                <p className={`text-sm font-bold truncate mt-0.5 ${showWarning ? 'text-amber-400/80' : 'text-white'}`}>
                  {showWarning ? 'Aguardando republicação' : 'Buscando parceiros no raio...'}
                </p>
              </div>
            </div>
          </div>
        )}

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
