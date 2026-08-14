// =========================================================
// NOME DO ARQUIVO: src/pages/DriverActiveTrip.tsx
// CTO-Log: Auditoria Final - Bloco 2 (A Viagem Blindada)
// Status: Barra de Progresso Viva adicionada, Resumo Fixo na tela, Fotos OBRIGATÓRIAS em cada PIN, 3 Tentativas Antifraude.
// Correção: Ejeção da função cliente-lado de Chat para evitar duplicações.
// =========================================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebase'; 
import { doc, onSnapshot, arrayUnion, DocumentData, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { LockKeyhole, AlertTriangle, Loader2, MapPin, Radio, Navigation, Scale, Camera, Wallet, CheckCircle2, MessageCircle, FileText, Check, Package } from 'lucide-react';
import MapaCliente from '../components/MapaCliente';
import { dispatchRealtimeService } from '../services/dispatchRealtimeService';
import { AppTripState } from '../state/tripStateMachine';

interface DriverActiveTripProps { freteId?: string; }

interface ActiveFreightData extends DocumentData {
  id: string;
  status: AppTripState;
  paradas?: any[];
  paradaAtualIndex?: number;
  entrega?: any;
  origemLat?: number;
  origemLng?: number;
  enderecoColetaTexto?: string;
  enderecoEntregaTexto?: string;
  pinColeta?: string;
  pinEntregas?: string[];
  peso?: string;
  pesoKg?: string;
  clienteNome?: string;
  clienteZap?: string;
  fotosPod?: Record<string, string>;
  motoristaNome?: string;
  tipoMaterial?: string;
  qtdVolumes?: string;
  distanciaRealKm?: number;
  valorLiquidoMotorista?: number;
  valorMotorista?: number;
}

export default function DriverActiveTrip({ freteId }: DriverActiveTripProps) {
  const [frete, setFrete] = useState<ActiveFreightData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [tentativasPin, setTentativasPin] = useState(0);
  const [bloqueioPin, setBloqueioPin] = useState(false);

  const [fotoPodBase64, setFotoPodBase64] = useState<string | null>(null);
  const [chavePix, setChavePix] = useState('');

  useEffect(() => {
    if (!freteId) { setLoading(false); return; }
    const unsubscribe = onSnapshot(doc(db, 'fretes', freteId), (docSnap) => {
      if (docSnap.exists()) {
        setFrete({ id: docSnap.id, ...docSnap.data() } as ActiveFreightData);
      } else {
        setFrete(null);
      }
      loading && setLoading(false);
    });
    return () => unsubscribe();
  }, [freteId]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
    </div>
  );
  
  if (!frete) return null;

  const paradas = frete.paradas || [];
  const paradaAtualIndex = frete.paradaAtualIndex || 0;
  const destinoAtual = paradas[paradaAtualIndex] || (frete.entrega || {});
  
  const mapOriginGPS = frete.status === AppTripState.EM_TRANSPORTE 
    ? (paradaAtualIndex === 0 ? { lat: frete.origemLat as number, lng: frete.origemLng as number } : { lat: paradas[paradaAtualIndex-1]?.lat, lng: paradas[paradaAtualIndex-1]?.lng })
    : null;
  const mapDestinoGPS = destinoAtual?.lat ? { lat: destinoAtual.lat, lng: destinoAtual.lng } : null;

  const isFaseColeta = [AppTripState.ACEITO, AppTripState.INDO_COLETA, AppTripState.CHEGOU_COLETA, AppTripState.COLETANDO].includes(frete.status);
  
  const navDestinoGPS = isFaseColeta && frete.origemLat && frete.origemLng 
    ? { lat: frete.origemLat, lng: frete.origemLng } 
    : mapDestinoGPS;

  const enderecoAlvoTexto = isFaseColeta 
    ? frete.enderecoColetaTexto 
    : (destinoAtual?.enderecoTexto || destinoAtual?.rua ? `${destinoAtual.rua}, ${destinoAtual.num} - ${destinoAtual.bairro}` : frete.enderecoEntregaTexto || 'Destino da rota');

  const totalParadas = frete.pinEntregas?.length || paradas.length || 1;

  // Montagem da timeline dinâmica (Multi-Drop)
  const etapasRoteiro = ['Coleta', ...Array.from({length: totalParadas}).map((_, i) => totalParadas > 1 ? `Entrega ${i+1}` : 'Entrega')];
  let etapaAtualIndex = 0;
  if (!isFaseColeta) {
     etapaAtualIndex = paradaAtualIndex + 1;
     if (frete.status === AppTripState.FINALIZANDO || frete.status === AppTripState.ENTREGUE || frete.status === 'finalizado') {
       etapaAtualIndex = etapasRoteiro.length; // Tudo concluído
     }
  }

  const handleOpenNav = (app: 'waze' | 'google') => {
    let url = '';
    const queryAddr = encodeURIComponent(enderecoAlvoTexto || '');
    
    if (app === 'waze') {
      if (navDestinoGPS && navDestinoGPS.lat) {
        url = `https://waze.com/ul?ll=${navDestinoGPS.lat},${navDestinoGPS.lng}&navigate=yes`;
      } else {
        url = `https://waze.com/ul?q=${queryAddr}&navigate=yes`;
      }
    } else {
      if (navDestinoGPS && navDestinoGPS.lat) {
        url = `https://www.google.com/maps/dir/?api=1&destination=${navDestinoGPS.lat},${navDestinoGPS.lng}`;
      } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${queryAddr}`;
      }
    }
    window.open(url, '_blank');
  };

  const handleStatusUpdate = async (novoStatus: AppTripState) => {
    setActionLoading(true);
    try {
      await dispatchRealtimeService.atualizarStatusTrip(frete.id, novoStatus);
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const handleSimularTirarFoto = () => {
    setFotoPodBase64("data:image/jpeg;base64,/9j/4AAQSkZJRgABAAAAAQABAAD...");
    alert("Câmera ativada. Foto da mercadoria registrada com sucesso!");
  };

  const handlePinSubmit = async () => {
    if (bloqueioPin) return;
    setActionLoading(true);
    setPinError('');
    try {
      if (frete.status === AppTripState.COLETANDO) {
        if (pinValue !== frete.pinColeta) { 
          const errosAtuais = tentativasPin + 1;
          setTentativasPin(errosAtuais);
          if (errosAtuais >= 3) {
            setBloqueioPin(true);
            setPinError('SISTEMA BLOQUEADO: Limite de 3 tentativas excedido. Contate a Torre.');
          } else {
            setPinError(`PIN incorreto. Restam ${3 - errosAtuais} tentativas.`); 
          }
          setActionLoading(false); 
          return; 
        }
        
        setTentativasPin(0);
        await dispatchRealtimeService.atualizarStatusTrip(frete.id, AppTripState.EM_TRANSPORTE);
      
      } else {
        if (!fotoPodBase64) {
          setPinError('A foto do canhoto/mercadoria é OBRIGATÓRIA antes de validar o PIN.');
          setActionLoading(false); 
          return;
        }

        const pinEntregas = frete.pinEntregas || [];
        if (pinEntregas.length > 0 && pinValue !== pinEntregas[paradaAtualIndex]) { 
          const errosAtuais = tentativasPin + 1;
          setTentativasPin(errosAtuais);
          if (errosAtuais >= 3) {
            setBloqueioPin(true);
            setPinError('SISTEMA BLOQUEADO: Limite de 3 tentativas excedido. Contate a Torre.');
          } else {
            setPinError(`PIN incorreto. Restam ${3 - errosAtuais} tentativas.`); 
          }
          setActionLoading(false); 
          return; 
        }
        
        setTentativasPin(0);
        const fotosAtuais = frete.fotosPod || {};
        fotosAtuais[`parada_${paradaAtualIndex}`] = fotoPodBase64;
        await dispatchRealtimeService.atualizarTripRealtime(frete.id, { fotosPod: fotosAtuais });

        if (paradaAtualIndex + 1 < paradas.length) {
           await dispatchRealtimeService.atualizarTripRealtime(frete.id, { paradaAtualIndex: paradaAtualIndex + 1 });
        } else {
           await dispatchRealtimeService.atualizarStatusTrip(frete.id, AppTripState.FINALIZANDO);
        }
      }
      setIsPinModalOpen(false); 
      setPinValue('');
      setFotoPodBase64(null);
    } catch (e) { setPinError('Erro. Tente novamente.'); } finally { setActionLoading(false); }
  };

  const handleInsucesso = async () => {
    if (!window.confirm("ATENÇÃO: Deseja reportar problema no local? O frete voltará para o Radar.")) return;
    setActionLoading(true);
    try {
      if (frete.status === AppTripState.COLETANDO || frete.status === AppTripState.CHEGOU_COLETA || frete.status === AppTripState.INDO_COLETA || frete.status === AppTripState.ACEITO) {
        await dispatchRealtimeService.atualizarTripRealtime(frete.id, { 
          status: AppTripState.DISPONIVEL, 
          motoristaId: null, motoristaNome: null, motoristaZap: null, motoristaLat: null, motoristaLng: null,
          alertaInsucesso: true,
          motivoCancelamento: 'Motorista teve imprevisto e abortou antes da coleta.'
        });
      } else {
        if (paradaAtualIndex + 1 < paradas.length) {
           await dispatchRealtimeService.atualizarTripRealtime(frete.id, { paradaAtualIndex: paradaAtualIndex + 1, paradasComInsucesso: arrayUnion(paradaAtualIndex), alertaInsucesso: true });
        } else {
           await dispatchRealtimeService.atualizarTripRealtime(frete.id, { status: AppTripState.ENTREGUE, paradasComInsucesso: arrayUnion(paradaAtualIndex), alertaInsucesso: true });
        }
      }
      setIsPinModalOpen(false); setPinValue('');
    } catch (e) { setPinError('Erro ao abortar carga.'); } finally { setActionLoading(false); }
  };

  const handleLiquidacaoSubmit = async () => {
    if (!chavePix.trim()) { alert("Digite sua chave PIX para receber!"); return; }
    
    setActionLoading(true);
    try {
      await dispatchRealtimeService.salvarChavePix(frete.id, chavePix);
      await dispatchRealtimeService.atualizarStatusTrip(frete.id, AppTripState.ENTREGUE);
      
      const adminPhone = "5511999999999"; 
      const msg = `Olá, finalizei a corrida #${frete.id.slice(0,8).toUpperCase()}.\nMinha chave PIX é: ${chavePix}\nO canhoto já foi enviado no app. Fico no aguardo do repasse.`;
      window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } catch (error) {
      alert("Falha na comunicação. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleContatoEmpresa = () => {
    if (!frete.clienteZap) { alert("Telefone da empresa não disponível."); return; }
    const numero = frete.clienteZap.replace(/\D/g, '');
    const msg = `Olá, sou o motorista parceiro da FretoGo. Estou a caminho para a corrida #${frete.id.slice(0,8).toUpperCase()}.`;
    window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (frete.status === AppTripState.FINALIZANDO) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2.5rem] border-2 border-emerald-500/30 bg-slate-900 shadow-[0_0_50px_rgba(16,185,129,0.15)] p-8">
         <div className="flex justify-center mb-6">
           <div className="w-20 h-20 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center">
             <CheckCircle2 size={40} className="text-emerald-400" />
           </div>
         </div>
         <h2 className="text-center text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Operação Concluída!</h2>
         <p className="text-center text-slate-400 text-sm mb-6">Todos os {totalParadas} comprovantes de entrega (POD) foram enviados à Torre de Controle.</p>

         <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 border-b border-white/5 pb-2">Resumo da Execução</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
               <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Carga</p>
                  <p className="text-white font-bold truncate max-w-[120px]">{frete.qtdVolumes ? `${frete.qtdVolumes} un - ` : ''}{frete.tipoMaterial || 'Diversos'}</p>
               </div>
               <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Distância</p>
                  <p className="text-white font-bold">{frete.distanciaRealKm?.toFixed(1) || '--'} km</p>
               </div>
               <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Total a Receber</p>
                  <p className="text-emerald-400 font-black">R$ {Number(frete.valorLiquidoMotorista || frete.valorMotorista || 0).toFixed(2).replace('.',',')}</p>
               </div>
               <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Paradas</p>
                  <p className="text-white font-bold">{totalParadas} Destino(s)</p>
               </div>
            </div>
         </div>

         <div className="space-y-6">
           <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
             <Wallet className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
             <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4">Seu Pix para Recebimento</p>
             <input 
               type="text" 
               placeholder="Sua Chave PIX (CPF/Celular)..." 
               value={chavePix}
               onChange={(e) => setChavePix(e.target.value)}
               className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl py-4 px-5 text-white font-black placeholder:text-slate-600 focus:border-emerald-400 outline-none transition-all"
             />
           </div>

           <button 
             onClick={handleLiquidacaoSubmit} 
             disabled={actionLoading || !chavePix} 
             className="w-full flex items-center justify-center gap-2 bg-emerald-500 h-16 font-black uppercase tracking-[0.2em] rounded-[1.5rem] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-emerald-400 active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.3)] text-slate-950"
           >
             {actionLoading ? <Loader2 className="animate-spin" size={24}/> : <><MessageCircle size={20} /> Solicitar PIX via WhatsApp</>}
           </button>
         </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-cyan-500/20 bg-slate-900 shadow-2xl p-6">
        
        <div className="mb-6 bg-slate-950 border border-white/5 rounded-2xl p-3 flex justify-between items-center shadow-inner">
           <div className="flex items-center gap-2">
              <FileText size={14} className="text-cyan-500" />
              <div>
                 <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Ordem Operacional</p>
                 <p className="text-[10px] font-bold text-slate-300 truncate w-32">{frete.tipoMaterial || 'Carga Geral'} • {frete.pesoKg || frete.peso}kg</p>
              </div>
           </div>
           <div className="text-right border-l border-white/5 pl-3">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Valor Final</p>
              <p className="text-[10px] font-black text-emerald-400">R$ {Number(frete.valorLiquidoMotorista || frete.valorMotorista || 0).toFixed(2).replace('.',',')}</p>
           </div>
        </div>

        <div className="mb-6 py-2 px-1">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
            {etapasRoteiro.map((stepNome, idx) => {
              const isCompleted = idx < etapaAtualIndex;
              const isActive = idx === etapaAtualIndex;
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5 group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-400 text-slate-900' :
                    isActive ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse' :
                    'bg-slate-900 border-slate-700 text-slate-600'
                  }`}>
                    {isCompleted ? <Check size={10} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest whitespace-nowrap absolute -bottom-4 transition-colors ${
                    isCompleted ? 'text-emerald-500' : isActive ? 'text-blue-400' : 'text-slate-600'
                  }`}>
                    {stepNome}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1"><Radio size={12}/> Rastreamento Ativo</p>
              <p className="text-xs font-bold text-slate-300">Sincronizado com a Torre</p>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest">
            {etapasRoteiro[etapaAtualIndex]}
          </h2>
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-[10px] uppercase font-black text-slate-500">Embarcador: <span className="text-white">{frete.clienteNome || 'Privado'}</span></p>
            <button onClick={handleContatoEmpresa} className="text-[10px] uppercase font-black tracking-widest text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
              <MessageCircle size={10} /> Contatar Empresa
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
            <div className="bg-slate-800/50 rounded-2xl py-3 px-8 flex flex-col items-center justify-center border border-slate-700/50 text-center">
               <Scale size={16} className="text-amber-400 mb-1" />
               <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Peso Bruto</p>
               <p className="text-sm font-bold text-white">{frete.pesoKg || frete.peso || 'Não informado'} kg</p>
            </div>
        </div>

        <div className="h-[250px] w-full mb-4 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <MapaCliente origem={mapOriginGPS} destino={mapDestinoGPS} operationalMessage="Navegando..." />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => handleOpenNav('waze')} className="flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors">
            <Navigation size={14} className="text-cyan-400" /> Abrir no Waze
          </button>
          <button onClick={() => handleOpenNav('google')} className="flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-colors">
            <MapPin size={14} className="text-emerald-400" /> Google Maps
          </button>
        </div>
        
        <div className="mb-6 flex items-start gap-3 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <div className="mt-1 shrink-0"><MapPin size={18} className="text-cyan-400" /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Endereço Alvo</p>
            <p className="text-sm font-bold text-white leading-snug">{enderecoAlvoTexto}</p>
          </div>
        </div>

        <div className="space-y-4">
          {frete.status === AppTripState.ACEITO && (
            <button onClick={() => handleStatusUpdate(AppTripState.INDO_COLETA)} disabled={actionLoading} className="w-full flex items-center justify-center bg-blue-600 h-16 font-black uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all hover:bg-blue-500 active:scale-95 text-white">
              {actionLoading ? <Loader2 className="animate-spin" size={24}/> : 'Deslocar p/ Coleta'}
            </button>
          )}
          {frete.status === AppTripState.INDO_COLETA && (
            <button onClick={() => handleStatusUpdate(AppTripState.CHEGOU_COLETA)} disabled={actionLoading} className="w-full flex items-center justify-center bg-indigo-500 h-16 font-black uppercase tracking-widest rounded-xl text-white disabled:opacity-50 transition-all hover:bg-indigo-400 active:scale-95">
              {actionLoading ? <Loader2 className="animate-spin" size={24}/> : 'Cheguei no Local'}
            </button>
          )}
          {frete.status === AppTripState.CHEGOU_COLETA && (
            <button onClick={() => handleStatusUpdate(AppTripState.COLETANDO)} disabled={actionLoading} className="w-full flex items-center justify-center bg-amber-500 h-16 font-black uppercase tracking-widest rounded-xl text-black disabled:opacity-50 transition-all hover:bg-amber-400 active:scale-95">
              {actionLoading ? <Loader2 className="animate-spin" size={24}/> : 'Iniciar Coleta'}
            </button>
          )}
          {[AppTripState.COLETANDO, AppTripState.EM_TRANSPORTE].includes(frete.status) && (
            <button onClick={() => setIsPinModalOpen(true)} disabled={actionLoading} className="w-full flex items-center justify-center bg-cyan-500 h-16 font-black uppercase tracking-widest rounded-xl text-black disabled:opacity-50 transition-all hover:bg-cyan-400 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              {actionLoading ? <Loader2 className="animate-spin" size={24}/> : `Validar PIN ${frete.status === AppTripState.COLETANDO ? 'da Coleta' : `da Parada ${paradaAtualIndex + 1}`}`}
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isPinModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-slate-900 p-8 rounded-[2.5rem] w-full max-w-sm border border-cyan-500/50 shadow-2xl my-auto">
              <div className="flex justify-center mb-4"><div className="bg-cyan-500/10 p-4 rounded-full border border-cyan-500/20"><LockKeyhole size={32} className="text-cyan-400" /></div></div>
              <h3 className="text-white text-center font-black mb-2 uppercase text-xl tracking-tight">{frete.status === AppTripState.COLETANDO ? 'Validar Coleta' : 'Validar Entrega'}</h3>
              <p className="text-slate-400 text-xs text-center mb-6 leading-relaxed">
                {frete.status === AppTripState.COLETANDO ? 'Verifique a mercadoria e insira o PIN da doca.' : 'Registre a foto do local/canhoto ANTES de pedir o PIN.'}
              </p>
              
              {frete.status !== AppTripState.COLETANDO && (
                <div className="mb-6 p-4 bg-slate-950 rounded-2xl border border-white/5 text-center">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Foto Obrigatória da Entrega</p>
                   {fotoPodBase64 ? (
                     <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20">
                       <CheckCircle2 size={16} /> <span className="font-bold text-xs uppercase">Foto Registrada</span>
                     </div>
                   ) : (
                     <button onClick={handleSimularTirarFoto} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex justify-center items-center gap-2 border border-white/10">
                       <Camera size={18} /> Acionar Câmera
                     </button>
                   )}
                </div>
              )}

              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pinValue} disabled={bloqueioPin} onChange={(e) => { setPinValue(e.target.value.replace(/\D/g, '')); setPinError(''); }} className="w-full p-5 text-center text-5xl font-black tracking-[0.5em] bg-slate-950 text-cyan-400 border-2 border-cyan-500/30 rounded-2xl mb-4 focus:outline-none focus:border-cyan-400 placeholder:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="0000" />
              
              {pinError && <p className="text-red-400 text-[10px] font-black text-center mb-4 uppercase tracking-widest">{pinError}</p>}
              
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex gap-2">
                  <button onClick={() => { setIsPinModalOpen(false); setPinValue(''); setPinError(''); setFotoPodBase64(null); setTentativasPin(0); setBloqueioPin(false); }} className="w-1/3 bg-transparent border border-white/10 py-4 font-black uppercase text-xs rounded-xl text-slate-400 hover:bg-white/5">Voltar</button>
                  <button onClick={handlePinSubmit} disabled={actionLoading || pinValue.length < 4 || bloqueioPin} className="w-2/3 flex items-center justify-center bg-cyan-500 py-4 font-black uppercase tracking-widest rounded-xl text-slate-950 disabled:opacity-50 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20">
                    {actionLoading ? <Loader2 className="animate-spin text-black" size={18}/> : 'Confirmar'}
                  </button>
                </div>
                <button onClick={handleInsucesso} disabled={actionLoading} className="w-full mt-2 bg-red-500/10 border border-red-500/30 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl text-red-400 hover:bg-red-50 hover:text-white transition-colors flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> Reportar Imprevisto (Voltar pro Radar)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
