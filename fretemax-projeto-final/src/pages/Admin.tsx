// =========================================================
// NOME DO ARQUIVO: src/pages/Admin.tsx
// CTO-Log: Torre de Controle Inteligente (Auditoria Fase 4).
// Status: Dashboard Expandido, Frota Preservada, Informações Ouro Injetadas na Malha Logística.
// Correção Bloco 3: Injeção do Painel de Segurança (Visibilidade Multi-PIN).
// Correção Atual: Sincronização exata de ícones da Frota e Botão "Vassoura" blindado para testes.
// =========================================================

import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, query, orderBy, runTransaction, where, updateDoc, serverTimestamp, limit, writeBatch, getDocs } from 'firebase/firestore';
import { AppTripState } from '../state/tripStateMachine'; 
import { 
  Loader2, CheckCircle, XCircle, Search, ShieldAlert, Truck, Users, 
  DollarSign, Activity, Clock, AlertTriangle, Eye, 
  Map as MapIcon, Wallet, Zap, MessageCircle, ShieldCheck, RefreshCcw, Lock, Target, Key, Radio,
  Trash2, BrainCircuit, TrendingDown, ArrowUpRight, PieChart, Package, FileText
} from 'lucide-react';

import { ftiAnalytics } from '../core/ai/analytics/ia.metrics';

// 🔥 CTO FIX: Chaves ajustadas para casar exatamente com o VEHICLE_CONFIG do Cliente.tsx
const CATEGORIAS_FROTA = [
  { id: 'moto', label: 'Moto / Courier', icon: '🏍️' },
  { id: 'carro', label: 'Carro / Hatch', icon: '🚗' },
  { id: 'utilitarios', label: 'Utilitário / Van', icon: '🚐' },
  { id: 'toco', label: 'Caminhão Toco', icon: '🚚' },
  { id: 'truck', label: 'Caminhão Truck', icon: '🚛' },
  { id: 'carreta', label: 'Carreta LS', icon: '🛣️' },
  { id: 'bitrem', label: 'Bi-trem / Cegonha', icon: '🚛💨' }
];

export default function Admin() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const [tab, setTab] = useState<'dashboard' | 'motoristas' | 'corridas'>('dashboard');
  const [fretes, setFretes] = useState<any[]>([]);
  const [motoristasPendentes, setMotoristasPendentes] = useState<any[]>([]);
  const [motoristasAprovados, setMotoristasAprovados] = useState<any[]>([]);
  const [motoristasOnline, setMotoristasOnline] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('todos');
  const [timeFilter, setTimeFilter] = useState('hoje'); 
  const [loading, setLoading] = useState(true);

  const [historicoPagamentos, setHistoricoPagamentos] = useState<any[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [reembolsosPendentes, setReembolsosPendentes] = useState<any[]>([]);

  const [ftiSummary, setFtiSummary] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  // ============================================================================
  // 1. CONEXÕES COM O BANCO DE DADOS
  // ============================================================================
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setAuthUser(u);
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const q = query(collection(db, 'motoristas_online'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMotoristasOnline(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const qPendentes = query(collection(db, 'motoristas_cadastros'), where('status', '==', 'pendente'));
    const unsubPendentes = onSnapshot(qPendentes, (snap) => {
      setMotoristasPendentes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    
    const qAprovados = query(collection(db, 'motoristas_cadastros'), where('status', '==', 'aprovado'));
    const unsubAprovados = onSnapshot(qAprovados, (snap) => {
      setMotoristasAprovados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubPendentes(); unsubAprovados(); };
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const q = query(collection(db, 'fretes'), orderBy('createdAt', 'desc'), limit(500));
    const unsubscribe = onSnapshot(q, (snap) => {
      setFretes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const q = query(collection(db, 'fretes'), where('status', '==', AppTripState.CANCELADO));
    const unsub = onSnapshot(q, (snap) => {
      setReembolsosPendentes(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => !f.reembolsado));
    });
    return () => unsub();
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const q = query(collection(db, 'fretes'), where('repasseEfetuado', '==', true), orderBy('repasseData', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setHistoricoPagamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [authUser]);

  useEffect(() => {
    if (tab === 'dashboard' && authUser) {
      ftiAnalytics.obterResumoAdmin().then(data => setFtiSummary(data));
    }
  }, [tab, authUser]);

  // ============================================================================
  // 2. LÓGICA DE CÁLCULO E FILTROS (TORRE DE CONTROLE INTELIGENTE)
  // ============================================================================
  const filterByTime = (frete: any, filterType: string) => {
    if (filterType === 'todos') return true;
    if (!frete.createdAt) return false;
    
    const freteDate = frete.createdAt.toDate ? frete.createdAt.toDate() : new Date(frete.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - freteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (filterType === 'hoje') return diffDays <= 1;
    if (filterType === '7dias') return diffDays <= 7;
    if (filterType === '30dias') return diffDays <= 30;
    if (filterType === 'ano') return diffDays <= 365;
    return true;
  };

  const fretesFiltrados = useMemo(() => {
    return fretes.filter(f => {
      const matchSearch = 
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.motoristaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.clienteNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cidadeOrigem?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'todos' || f.status === statusFilter;
      const matchTime = filterByTime(f, timeFilter);
      
      return matchSearch && matchStatus && matchTime;
    });
  }, [fretes, searchTerm, statusFilter, timeFilter]);

  const stats = useMemo(() => {
    const fretesDoPeriodo = fretes.filter(f => filterByTime(f, timeFilter));
    const hoje = new Date(); hoje.setHours(0,0,0,0);

    const faturado = fretesDoPeriodo.filter(f => [AppTripState.ACEITO, AppTripState.INDO_COLETA, AppTripState.COLETANDO, AppTripState.EM_TRANSPORTE, AppTripState.ENTREGUE, 'finalizado'].includes(f.status)).reduce((acc, f) => acc + (Number(f.valorBruto) || Number(f.valorTotal) || 0), 0);
    const lucro = fretesDoPeriodo.filter(f => [AppTripState.ACEITO, AppTripState.INDO_COLETA, AppTripState.COLETANDO, AppTripState.EM_TRANSPORTE, AppTripState.ENTREGUE, 'finalizado'].includes(f.status)).reduce((acc, f) => acc + (Number(f.valorComissao) || Number(f.lucroPlataforma) || 0), 0);
    
    const escrowRetido = fretes.filter(f => [AppTripState.AGUARDANDO_PAGAMENTO, AppTripState.DISPONIVEL, AppTripState.ACEITO, AppTripState.INDO_COLETA, AppTripState.CHEGOU_COLETA, AppTripState.COLETANDO, AppTripState.EM_TRANSPORTE].includes(f.status)).reduce((acc, f) => acc + (Number(f.valorFreteBruto) || Number(f.valorTotal) || 0), 0);

    const entregues = fretesDoPeriodo.filter(f => [AppTripState.ENTREGUE, 'finalizado'].includes(f.status)).length;
    const ticketMedio = entregues > 0 ? (faturado / entregues) : 0;
    
    const cancelados = fretesDoPeriodo.filter(f => f.status === AppTripState.CANCELADO).length;
    
    const totalFretesValidos = entregues + cancelados;
    const taxaConversao = totalFretesValidos > 0 ? ((entregues / totalFretesValidos) * 100).toFixed(1) : 0;

    const faturadoHoje = fretes.filter(f => {
      const data = f.createdAt?.toDate ? f.createdAt.toDate() : new Date(f.createdAt);
      return data >= hoje;
    }).reduce((acc, f) => acc + (Number(f.valorTotal) || 0), 0);

    const aPagarMotoristas = fretes.filter(f => f.status === AppTripState.ENTREGUE && !f.repasseEfetuado).reduce((acc, f) => acc + (Number(f.valorLiquidoMotorista) || Number(f.valorMotorista) || 0), 0);

    const pagoHoje = fretes.filter(f => {
      const data = f.repasseData?.toDate ? f.repasseData.toDate() : null;
      return data && data >= hoje && f.repasseEfetuado;
    }).reduce((acc, f) => acc + (Number(f.valorLiquidoMotorista) || 0), 0);

    const repasses = fretes.filter(f => f.status === AppTripState.ENTREGUE).length;

    const motoristasRetorno = motoristasOnline.filter(m => m.modoRetorno === true).length;
    const fretesParados = fretes.filter(f => f.status === AppTripState.DISPONIVEL && (Date.now() - (f.createdAt?.toMillis ? f.createdAt.toMillis() : Date.now())) > 1800000).length;
    const semComprovante = fretes.filter(f => f.status === AppTripState.ENTREGUE && !f.comprovanteUrl).length;
    const motoristasOcupados = motoristasOnline.filter(m => m.status === 'ocupado').length;
    const insucessos = fretes.filter(f => f.alertaInsucesso === true).length;

    const alertas24h = fretes.filter(f => {
      if (f.status !== AppTripState.ENTREGUE || f.repasseEfetuado) return false;
      const entregaData = f.updatedAt?.toDate ? f.updatedAt.toDate() : new Date();
      const horasDesdeEntrega = (Date.now() - entregaData.getTime()) / (1000 * 60 * 60);
      return horasDesdeEntrega >= 20 && horasDesdeEntrega < 24;
    }).length;

    return { 
      faturado, lucro, entregues, ticketMedio, repasses, cancelados, taxaConversao, escrowRetido,
      faturadoHoje, aPagarMotoristas, pagoHoje, motoristasRetorno, fretesParados, semComprovante, motoristasOcupados, insucessos, alertas24h 
    };
  }, [fretes, motoristasOnline, timeFilter]);

  const contagemFrota = useMemo(() => {
    const contagem: Record<string, number> = {
      moto: 0, carro: 0, utilitarios: 0, 
      toco: 0, truck: 0, carreta: 0, bitrem: 0
    };
    motoristasAprovados.forEach(m => {
      const cat = m.categoria ? m.categoria.toLowerCase() : '';
      if (contagem[cat] !== undefined) contagem[cat]++;
    });
    return contagem;
  }, [motoristasAprovados]);

  const aptosPix = useMemo(() => motoristasAprovados.filter(m => m.fotoCnh && m.fotoSelfie).length, [motoristasAprovados]);

  // ============================================================================
  // 3. AÇÕES OPERACIONAIS DA TORRE DE CONTROLE
  // ============================================================================
  const handleAprovacaoMotorista = async (id: string, status: 'aprovado' | 'rejeitado') => {
    if (!window.confirm(`Deseja confirmar a ação: ${status.toUpperCase()}?`)) return;
    try {
      const payload: any = { status };
      if (status === 'aprovado') payload.state = 'ONLINE'; 
      
      await updateDoc(doc(db, 'motoristas_cadastros', id), payload);
      alert(`Status atualizado para: ${status}`);
    } catch (e: any) { alert("Erro ao atualizar o banco de dados: " + e.message); }
  };

  const forceStatus = async (id: string, novoStatus: string) => {
    if (!window.confirm(`Forçar status para: ${novoStatus.toUpperCase()}?`)) return;
    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'fretes', id);
        const d = await t.get(ref);
        if (!d.exists()) throw new Error("Frete não encontrado.");

        const currentData = d.data();
        if (novoStatus === AppTripState.CANCELADO && currentData.status === AppTripState.EM_TRANSPORTE) {
           throw new Error("Motorista em transporte com a carga. Cancelamento direto abortado.");
        }

        const updateData: any = {
          status: novoStatus,
          adminAction: true,
          updatedAt: serverTimestamp()
        };

        if (novoStatus === 'finalizado' && currentData.status === AppTripState.ENTREGUE) {
          updateData.repasseEfetuado = true;
          updateData.repasseData = serverTimestamp();
          updateData.repassePor = authUser.uid;
          updateData.repasseValor = Number(currentData.valorLiquidoMotorista || currentData.valorMotorista || 0);
        }

        t.update(ref, updateData);
      });
      if (novoStatus === 'finalizado') alert('✅ Repasse liquidado e registrado no histórico financeiro!');
      else alert(`✅ Frete alterado para ${novoStatus}`);
    } catch (e: any) { alert(e.message); }
  };

  const handleReembolso = async (idPedido: string) => {
    if (!window.confirm("CRÍTICO: Deseja estornar o valor via PIX (Mercado Pago) de volta para o Embarcador?")) return;
    try {
      const res = await fetch('/api/reembolso', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ idPedido }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha API do Mercado Pago');
      
      await updateDoc(doc(db, 'fretes', idPedido), { 
        reembolsado: true, 
        reembolsoData: serverTimestamp(), 
        reembolsoPor: authUser.uid 
      });
      alert('SUCESSO! O PIX foi estornado e registrado.');
    } catch (error: any) { 
      alert(`Erro no Estorno: ${error.message}`); 
    }
  };

  const handlePedirChavePix = (frete: any) => {
    const telefone = frete.motoristaZap || frete.telefoneMotorista;
    if (!telefone) {
      alert("Número do motorista não encontrado no sistema.");
      return;
    }
    const numeroLimpo = telefone.replace(/\D/g, '');
    const valor = Number(frete.valorLiquidoMotorista || frete.valorMotorista || 0).toFixed(2).replace('.', ',');
    const msg = `Olá *${frete.motoristaNome}*, aqui é a central operacional do *FretoGo*.\n\nVimos que você finalizou a corrida #${frete.id.slice(0,8).toUpperCase()}.\n\nPara liquidarmos o valor de *R$ ${valor}*, confirme sua Chave PIX.`;
    
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // 🔥 CTO FIX: "A Vassoura Inteligente de QA" (Apaga apenas testes. Faturamento real é intocável)
  const handleNuclearReset = async () => {
    const code = window.prompt("⚠️ CUIDADO: Esta ação vai varrer APENAS os fretes de teste (Bypass) e limpar o Radar. O faturamento real será preservado. Digite 'ZERAR' para prosseguir:");
    if (code !== 'ZERAR') { alert("Ação abortada."); return; }
    
    setIsCleaning(true);
    try {
      const batch = writeBatch(db);
      let countFretes = 0; let countLogs = 0;

      const fretesRef = collection(db, 'fretes');
      const snapshot = await getDocs(fretesRef);
      
      snapshot.forEach((doc) => { 
          const data = doc.data();
          // Lógica Invertida (Segurança Máxima): Se NÃO tiver um transactionId real do MercadoPago, é teste ou lixo e pode ser apagado.
          const isRealPayment = data.transactionId && !String(data.transactionId).startsWith('QA_BYPASS_');
          
          if (!isRealPayment) {
             batch.delete(doc.ref); 
             countFretes++; 
          }
      });
      
      // Limpa as conversas de IA para não pesar o banco
      const logsRef = collection(db, 'analytics_ia_logs');
      const logsSnap = await getDocs(logsRef);
      logsSnap.forEach((doc) => { batch.delete(doc.ref); countLogs++; });
      
      if (countFretes > 0 || countLogs > 0) {
          await batch.commit();
          alert(`✅ Vassoura Concluída! ${countFretes} fretes de teste foram apagados. Faturamento oficial protegido.`);
          window.location.reload(); 
      } else {
          alert('A base já está limpa. Nenhum frete de teste foi encontrado.');
      }
      
    } catch (error) {
      alert("Falha ao executar a limpeza de testes.");
    } finally {
      setIsCleaning(false);
    }
  };

  // ============================================================================
  // 4. RENDERIZAÇÃO DA TELA
  // ============================================================================
  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-cyan-500 w-12 h-12" />
      <p className="text-cyan-500 font-black animate-pulse uppercase tracking-widest text-xs">Sincronizando satélites e telemetria da malha...</p>
    </div>
  );

  if (!authUser) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
        <ShieldAlert className="text-red-500 w-12 h-12" />
      </div>
      <h2 className="text-white font-black text-4xl uppercase italic tracking-tighter">Login Necessário</h2>
      <p className="text-slate-500 mt-3 max-w-sm font-medium leading-relaxed">Você precisa estar logado na plataforma para acessar a Torre de Controle FRETOGO.</p>
    </div>
  );

  if (!isUnlocked) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_50%)]" />
      <div className="bg-slate-900/80 border border-white/10 p-10 rounded-[2rem] backdrop-blur-xl shadow-2xl flex flex-col items-center w-full max-w-sm relative z-10">
        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/20">
          <Lock className="w-10 h-10 text-cyan-500" />
        </div>
        <h2 className="text-white font-black text-2xl uppercase tracking-widest mb-2 text-center">Torre de Controle</h2>
        <p className="text-slate-400 text-xs text-center mb-8">Insira a chave criptográfica (Senha Mestra).</p>
        <div className="w-full relative mb-6">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 w-5 h-5" />
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (passwordInput === '152085') setIsUnlocked(true); else { alert("Senha incorreta"); setPasswordInput(''); } } }} placeholder="Código de Acesso" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-center font-black tracking-[0.5em] focus:border-cyan-500 outline-none transition-all" />
        </div>
        <button onClick={() => { if (passwordInput === '152085') setIsUnlocked(true); else { alert("Senha incorreta"); setPasswordInput(''); } }} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all">
          Desbloquear Terminal
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-24">
      
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(8,145,178,0.4)]">
                <Radio className="text-white w-7 h-7 animate-pulse" />
             </div>
             <div>
               <h1 className="text-2xl font-black text-white italic leading-none uppercase tracking-tighter">TORRE DE CONTROLE <span className="text-cyan-500">FRETOGO</span></h1>
               <p className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.2em] flex items-center gap-1">
                 <Activity size={10}/> Sistema de Gestão Total
               </p>
             </div>
          </div>

          <nav className="flex flex-wrap bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard Financeiro', icon: Activity },
              { id: 'motoristas', label: 'Frota & Documentos', icon: Users, badge: motoristasPendentes.length },
              { id: 'corridas', label: 'Torre Operacional (Cargas)', icon: MapIcon }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${tab === item.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon size={16} />
                {item.label}
                {item.badge ? <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce">{item.badge}</span> : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* ========================================================================= ABA DASHBOARD (NOVA TORRE) */}
        {tab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
               <button onClick={handleNuclearReset} disabled={isCleaning} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-inner">
                  {isCleaning ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} ZERAR FRETES DE TESTE (QA)
               </button>

               <div className="bg-slate-900/50 border border-white/5 rounded-xl p-1 flex gap-1 backdrop-blur-sm shadow-inner">
                 {[
                    { id: 'hoje', label: 'Hoje' },
                    { id: '7dias', label: '7 Dias' },
                    { id: '30dias', label: '30 Dias' },
                    { id: 'ano', label: 'Este Ano' },
                    { id: 'todos', label: 'Histórico Completo' }
                 ].map(f => (
                    <button 
                      key={f.id}
                      onClick={() => setTimeFilter(f.id)}
                      className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${timeFilter === f.id ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                      {f.label}
                    </button>
                 ))}
               </div>
            </div>

            {/* 🔥 ALERTA OPERACIONAL DE ATENÇÃO MÁXIMA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               {stats.alertas24h > 0 && (
                 <div className="bg-amber-950/60 border border-amber-500/50 rounded-2xl p-5 flex items-center gap-4 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                   <div className="bg-amber-500/20 p-3 rounded-full"><AlertTriangle className="text-amber-500" size={24} /></div>
                   <div>
                     <p className="text-sm font-black text-amber-400 uppercase tracking-widest">Atenção: {stats.alertas24h} Repasse(s) Crítico(s)</p>
                     <p className="text-[10px] text-amber-300/70 font-medium">Fretes entregues aguardando repasse financeiro na aba Corridas.</p>
                   </div>
                 </div>
               )}
               
               {reembolsosPendentes.length > 0 && (
                 <div className="bg-red-950/60 border border-red-500/50 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                   <div className="bg-red-500/20 p-3 rounded-full"><RefreshCcw className="text-red-500 animate-spin-slow" size={24} /></div>
                   <div>
                     <p className="text-sm font-black text-red-400 uppercase tracking-widest">Ação Necessária: {reembolsosPendentes.length} Estorno(s)</p>
                     <p className="text-[10px] text-red-300/70 font-medium">Operações canceladas precisando de reembolso urgente no Mercado Pago.</p>
                   </div>
                 </div>
               )}

               {stats.fretesParados > 0 && (
                 <div className="bg-purple-950/60 border border-purple-500/50 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                   <div className="bg-purple-500/20 p-3 rounded-full"><Clock className="text-purple-400 animate-pulse" size={24} /></div>
                   <div>
                     <p className="text-sm font-black text-purple-400 uppercase tracking-widest">Gargalo: {stats.fretesParados} Cargas Paradas</p>
                     <p className="text-[10px] text-purple-300/70 font-medium">Cargas no Radar há mais de 30 min sem aceite. Sugira Auto-Bid.</p>
                   </div>
                 </div>
               )}
            </div>

            {/* ================= DASHBOARD FINANCEIRO E CONVERSÃO ================= */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
              
              <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/30 transition-all flex flex-col justify-between col-span-2">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><Activity size={14} className="text-cyan-500"/> Volume Transacionado Bruto</p>
                 <div className="relative z-10">
                   <span className="text-sm font-bold text-slate-500 block mb-1">R$</span>
                   <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">{stats.faturado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                 </div>
              </div>

              <div className="bg-slate-900/60 border border-green-500/20 p-6 rounded-[2rem] backdrop-blur-md relative overflow-hidden group shadow-[0_0_30px_rgba(34,197,94,0.05)] hover:border-green-500/50 transition-all flex flex-col justify-between col-span-2">
                 <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
                 <p className="text-[10px] font-black text-green-500/70 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><TrendingDown size={14} className="text-green-500 rotate-180"/> Take Rate (Lucro Plataforma)</p>
                 <div className="relative z-10">
                   <span className="text-sm font-bold text-green-600/50 block mb-1">R$</span>
                   <h3 className="text-3xl md:text-5xl font-black text-green-400 tracking-tighter leading-none">{stats.lucro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                 </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10"><PieChart size={14} className="text-indigo-400"/> Conversão</p>
                 <div className="relative z-10">
                   <h3 className="text-3xl font-black text-indigo-400 tracking-tighter leading-none">{stats.taxaConversao}%</h3>
                   <span className="text-[10px] font-bold text-slate-500 mt-1 block">Entregues: {stats.entregues}</span>
                 </div>
              </div>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-5 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Dinheiro em Custódia (Escrow)</p>
                <div>
                  <h3 className="text-2xl font-black text-emerald-400 tracking-tighter">R$ {stats.escrowRetido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                  <p className="text-[9px] text-emerald-500/50 mt-1 font-bold uppercase">Blindado Atualmente</p>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/30 p-5 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
                <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={12}/> A Pagar (Motoristas)</p>
                <div>
                  <h3 className="text-2xl font-black text-amber-400 tracking-tighter">R$ {stats.aPagarMotoristas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                  <p className="text-[9px] text-amber-500/50 mt-1 font-bold uppercase">{stats.repasses} repasses na fila</p>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MapIcon size={12} className="text-blue-400"/> Frota em Rota Escolta</p>
                 <div className="flex items-end gap-3">
                   <h3 className="text-2xl font-black text-white tracking-tighter">{motoristasOnline.length}</h3>
                   <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mb-1">Online</span>
                 </div>
              </div>

              <div className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Truck size={12} className="text-slate-400"/> Ticket Médio</p>
                 <h3 className="text-2xl font-black text-white tracking-tighter">R$ {stats.ticketMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
              </div>
            </div>

            {/* BASE DE OPERADORES & FTI AI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              <div className="bg-slate-900/40 border border-cyan-500/20 rounded-[2rem] p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <BrainCircuit size={20} className="text-cyan-400" />
                  <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest">
                     Métricas da IA (FTI)
                  </h3>
                </div>
                
                {ftiSummary ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Interações Neurais</p>
                      <p className="text-2xl font-bold text-white">{ftiSummary.totalInteracoes}</p>
                    </div>
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Custo Nuvem (USD)</p>
                      <p className="text-2xl font-bold text-cyan-400">${ftiSummary.custoTotalUsd?.toFixed(4)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Carregando telemetria...
                  </div>
                )}
              </div>

              <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Target size={16} /> Auditoria da Frota Homologada
                  </h2>
                  <span className="text-[10px] font-black text-white bg-slate-800 px-3 py-1 rounded-lg">TOTAL: {motoristasAprovados.length}</span>
                </div>
                
                {/* 🔥 A FROTA FOI RESTAURADA E NÃO ESTÁ MAIS OCULTA */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {CATEGORIAS_FROTA.map(cat => {
                    const qtd = contagemFrota[cat.id] || 0;
                    return (
                      <div key={cat.id} className="bg-slate-950/50 border border-white/5 py-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-xl mb-1">{cat.icon}</span>
                        <h3 className="text-lg font-black text-white">{qtd}</h3>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* HISTÓRICO FINANCEIRO INFERIOR */}
            <div className="flex justify-start mb-6">
              <button
                onClick={() => setShowHistorico(!showHistorico)}
                className="bg-slate-800/50 hover:bg-slate-800 border border-white/10 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <ArrowUpRight size={14} className="text-green-400" /> {showHistorico ? 'Ocultar Caixa' : 'Expandir Histórico de Caixa'} ({historicoPagamentos.length})
              </button>
            </div>

            {showHistorico && (
              <div className="mb-8 bg-slate-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={18} /> Últimas Liquidações de PIX
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-500">Data</th>
                        <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-500">ID da Operação</th>
                        <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-500">Motorista Parceiro</th>
                        <th className="text-right py-3 px-4 text-[10px] font-black uppercase text-slate-500">Valor Liquidado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoPagamentos.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-600 text-xs font-bold uppercase tracking-widest">Nenhum repasse registrado na base de dados</td></tr>
                      ) : historicoPagamentos.slice(0, 10).map(p => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 text-slate-300 font-medium">
                            {p.repasseData?.toDate ? p.repasseData.toDate().toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="py-4 px-4 font-mono text-[10px] text-cyan-400">#{p.id.slice(0,8).toUpperCase()}</td>
                          <td className="py-4 px-4 text-white font-bold">{p.motoristaNome || 'N/A'}</td>
                          <td className="py-4 px-4 text-right text-green-400 font-black">
                            R$ {Number(p.repasseValor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= ABA MOTORISTAS */}
        {tab === 'motoristas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
               <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">Homologação & <span className="text-cyan-500">Auditoria de Frota</span></h2>
               <div className="flex gap-2">
                 <span className="bg-slate-900 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-white/10 tracking-widest shadow-inner flex items-center gap-2">
                   <Clock size={12} className="text-amber-500"/> {motoristasPendentes.length} Na Fila
                 </span>
                 <span className="bg-slate-900 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-white/10 tracking-widest shadow-inner flex items-center gap-2">
                   <ShieldCheck size={12} className="text-green-500"/> {aptosPix} Aptos PIX
                 </span>
               </div>
            </div>

            {motoristasPendentes.length === 0 ? (
              <div className="text-center py-32 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-white/10 backdrop-blur-sm">
                 <CheckCircle className="w-20 h-20 text-slate-700 mx-auto mb-6" />
                 <p className="text-slate-400 font-black uppercase italic tracking-widest text-lg">Muralha Limpa</p>
                 <p className="text-slate-500 text-sm mt-2">Não há novos cadastros aguardando auditoria na Torre de Controle.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {motoristasPendentes.map(m => (
                  <div key={m.id} className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden backdrop-blur-md hover:border-cyan-500/30 transition-all">
                    
                    <div className="flex justify-between items-start mb-8 relative z-10 border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                           <ShieldAlert className="text-amber-500 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{m.nome}</h3>
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">{m.whatsapp || m.telefone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Identidade Oficial</p>
                        <p className="text-sm font-black text-white tracking-wider mb-1">{m.cpf || '---'}</p>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Veículo Operacional</p>
                        <p className="text-sm font-black text-cyan-400 uppercase italic mb-1">{(m.categoria || '').replace('_',' ')}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">{m.placa || 'Sem placa'}</p>
                      </div>
                    </div>

                    <div className="mb-8 grid grid-cols-3 gap-2">
                       <div className="flex flex-col gap-1">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center">Doc CNH</p>
                          <a href={m.fotoCnh || m.cnhUrl} target="_blank" rel="noreferrer" className="block relative group/img overflow-hidden rounded-xl h-24 border border-white/10 bg-black cursor-pointer shadow-inner">
                            {m.fotoCnh || m.cnhUrl ? <img src={m.fotoCnh || m.cnhUrl} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-all" alt="CNH" /> : <span className="text-red-500 text-[10px] flex items-center justify-center h-full">Falta</span>}
                          </a>
                       </div>
                       <div className="flex flex-col gap-1">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center">Doc Veículo</p>
                          <a href={m.fotoDocumento || m.documentoUrl} target="_blank" rel="noreferrer" className="block relative group/img overflow-hidden rounded-xl h-24 border border-white/10 bg-black cursor-pointer shadow-inner">
                            {m.fotoDocumento || m.documentoUrl ? <img src={m.fotoDocumento || m.documentoUrl} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-all" alt="DOC" /> : <span className="text-red-500 text-[10px] flex items-center justify-center h-full">Falta</span>}
                          </a>
                       </div>
                       <div className="flex flex-col gap-1">
                          <p className="text-[9px] text-cyan-500 font-black uppercase tracking-widest text-center">Selfie AntiFraude</p>
                          <a href={m.fotoSelfie} target="_blank" rel="noreferrer" className="block relative group/img overflow-hidden rounded-xl h-24 border border-cyan-500/30 bg-cyan-900/10 cursor-pointer shadow-inner">
                            {m.fotoSelfie ? <img src={m.fotoSelfie} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-all" alt="Selfie" /> : <span className="text-red-500 text-[10px] flex items-center justify-center h-full">Falta</span>}
                          </a>
                       </div>
                    </div>

                    <div className="flex gap-4 relative z-10 pt-6 border-t border-white/5">
                      <button onClick={() => handleAprovacaoMotorista(m.id, 'rejeitado')} className="flex-1 bg-transparent border border-red-500/30 text-red-400 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 hover:text-white transition-all">Rejeitar</button>
                      <button onClick={() => handleAprovacaoMotorista(m.id, 'aprovado')} className="flex-[2] bg-cyan-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:bg-cyan-500 transition-all flex items-center justify-center gap-2"><ShieldCheck size={16}/> Aprovar Parceiro</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= ABA CORRIDAS (MALHA LOGÍSTICA) */}
        {tab === 'corridas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-4 mb-8 shadow-xl">
                <div className="flex-1 relative">
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500 w-5 h-5" />
                   <input 
                    placeholder="Buscar por ID ou Nome na malha..." 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white font-bold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600" 
                   />
                </div>
                <div className="flex gap-3">
                  <select 
                    onChange={e => setStatusFilter(e.target.value)} 
                    value={statusFilter}
                    className="bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-slate-300 font-black uppercase text-[10px] tracking-widest outline-none cursor-pointer hover:border-cyan-500 transition-all"
                  >
                    <option value="todos">Status Global</option>
                    <option value={AppTripState.DISPONIVEL}>Radar Ativo</option>
                    <option value={AppTripState.ACEITO}>Motorista Acionado</option>
                    <option value={AppTripState.INDO_COLETA}>Em Deslocamento</option>
                    <option value={AppTripState.EM_TRANSPORTE}>Em Rota de Escolta</option>
                    <option value={AppTripState.ENTREGUE}>Aguardando Liquidação</option>
                    <option value="finalizado">Repasse Finalizado</option>
                    <option value={AppTripState.CANCELADO}>Operações Abortadas</option>
                  </select>
                </div>
             </div>

             <div className="space-y-6">
                {fretesFiltrados.length === 0 ? (
                  <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border border-dashed border-white/5 backdrop-blur-sm">
                    <MapIcon size={48} className="mx-auto mb-6 text-slate-700" />
                    <p className="text-slate-400 font-black uppercase italic tracking-widest text-lg">Malha Logística Estável</p>
                    <p className="text-slate-600 text-sm mt-2">Nenhuma carga transitando nos filtros selecionados.</p>
                  </div>
                ) : (
                  fretesFiltrados.map(f => (
                    <div key={f.id} className="bg-slate-900/80 border rounded-[2.5rem] p-6 md:p-8 transition-all relative overflow-hidden group shadow-2xl backdrop-blur-md border-white/5 hover:border-cyan-500/30">
                      
                      <div className="flex flex-col lg:flex-row justify-between gap-8 pl-2">
                        
                        <div className="flex-[1.5]">
                          <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                            <span className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                              {f.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">OP_ID: #{f.id.slice(0,8).toUpperCase()}</span>
                          </div>

                          <div className="flex items-start gap-5">
                             <div className="flex flex-col items-center gap-1 mt-1">
                               <div className="w-4 h-4 bg-slate-950 border-2 border-blue-500 rounded-full"></div>
                               <div className="w-0.5 h-12 bg-slate-800 rounded-full"></div>
                               <div className="w-4 h-4 bg-slate-950 border-2 border-green-500 rounded-full"></div>
                             </div>
                             <div className="space-y-6 flex-1">
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Origem / Coleta</p>
                                   <p className="text-sm font-bold text-white leading-tight">{f.origem?.endereco || f.cidadeOrigem || 'Endereço Indisponível'}</p>
                                </div>
                                <div>
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Destino Final</p>
                                   <p className="text-sm font-bold text-white leading-tight">{f.destino?.endereco || f.cidadeDestino || 'Endereço Indisponível'}</p>
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 bg-slate-950 p-4 rounded-2xl border border-white/5">
                             <div className="border-r border-white/5 pr-2">
                               <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Distância</p>
                               <p className="text-xs font-bold text-cyan-400">{f.distanciaTotalKm?.toFixed(1) || f.distancia?.toFixed(1) || '--'} km</p>
                             </div>
                             <div className="border-r border-white/5 pr-2">
                               <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Volume/Peso</p>
                               <p className="text-xs font-bold text-slate-300">{f.qtdVolumes ? `${f.qtdVolumes}un / ` : ''}{f.pesoKg || f.peso || '--'}kg</p>
                             </div>
                             <div className="border-r border-white/5 pr-2">
                               <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Carga</p>
                               <p className="text-xs font-bold text-slate-300 truncate max-w-[80px]" title={f.tipoMaterial}>{f.tipoMaterial || 'Diversos'}</p>
                             </div>
                             <div>
                               <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Veículo</p>
                               <p className="text-xs font-bold text-amber-400 capitalize">{(f.veiculo || f.categoria)?.replace('_', ' ') || '--'}</p>
                             </div>
                          </div>
                          
                          {f.observacoes && (
                             <div className="mt-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                               <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center gap-1"><FileText size={10}/> Instruções da Doca</p>
                               <p className="text-xs text-slate-300 italic">{f.observacoes}</p>
                             </div>
                          )}

                          {/* 🔥 CTO FIX: VISIBILIDADE DOS PINS NA TORRE (Bloco 3) */}
                          <div className="mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                             <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Chaves de Segurança (PINs e Fotos)</p>
                             <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                               <div className="bg-slate-950 p-2 rounded border border-white/5">
                                  <p className="text-[8px] uppercase text-slate-500 font-bold mb-1">PIN Coleta</p>
                                  <p className="text-sm font-mono text-white tracking-widest">{f.pinColeta || '---'}</p>
                               </div>
                               
                               {f.pinEntregas && Array.isArray(f.pinEntregas) ? f.pinEntregas.map((pin: string, idx: number) => (
                                  <div key={idx} className="bg-slate-950 p-2 rounded border border-white/5 flex flex-col justify-between">
                                    <div>
                                      <p className="text-[8px] uppercase text-emerald-500 font-bold mb-1">PIN Entrega {idx + 1}</p>
                                      <p className="text-sm font-mono text-emerald-400 tracking-widest">{pin}</p>
                                    </div>
                                    {f.fotosEntregas && f.fotosEntregas[idx] ? (
                                       <a href={f.fotosEntregas[idx]} target="_blank" rel="noreferrer" className="text-[8px] font-black uppercase tracking-widest text-cyan-400 underline mt-2 block">Ver Foto</a>
                                    ) : (
                                       <p className="text-[8px] font-black uppercase tracking-widest text-amber-500/70 mt-2">S/ Foto</p>
                                    )}
                                  </div>
                               )) : (
                                  <div className="bg-slate-950 p-2 rounded border border-white/5 flex flex-col justify-between">
                                    <div>
                                      <p className="text-[8px] uppercase text-emerald-500 font-bold mb-1">PIN Entrega Final</p>
                                      <p className="text-sm font-mono text-emerald-400 tracking-widest">{typeof f.pinEntregas === 'string' ? f.pinEntregas : f.pinEntrega || '---'}</p>
                                    </div>
                                    {f.comprovanteUrl ? (
                                       <a href={f.comprovanteUrl} target="_blank" rel="noreferrer" className="text-[8px] font-black uppercase tracking-widest text-cyan-400 underline mt-2 block">Ver Foto</a>
                                    ) : (
                                       <p className="text-[8px] font-black uppercase tracking-widest text-amber-500/70 mt-2">S/ Foto</p>
                                    )}
                                  </div>
                               )}
                             </div>
                          </div>

                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px] border-l border-white/5 pl-4 justify-center mt-4 lg:mt-0">
                           
                           {f.status === AppTripState.ENTREGUE && (
                             <div className="flex flex-col gap-2">
                               <button onClick={() => handlePedirChavePix(f)} className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2">
                                 <MessageCircle size={14} /> Cobrar Chave PIX
                               </button>

                               <button onClick={() => forceStatus(f.id, 'finalizado')} className="bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex flex-col items-center justify-center gap-1 group">
                                 <span className="flex items-center gap-1"><Wallet size={14} /> Liquidar Repasse</span>
                                 <span className="text-[10px] font-bold text-purple-200">R$ {Number(f.valorLiquidoMotorista || f.valorMotorista).toFixed(2).replace('.',',')}</span>
                               </button>
                             </div>
                           )}

                           {f.status === AppTripState.CANCELADO && !f.reembolsado && (
                             <button onClick={() => handleReembolso(f.id)} className="bg-amber-600 hover:bg-amber-500 text-slate-900 py-4 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex flex-col items-center justify-center gap-1">
                               <span className="flex items-center gap-1"><RefreshCcw size={14} /> Estornar PIX (MP)</span>
                             </button>
                           )}

                           {f.reembolsado && (
                             <div className="bg-slate-900 border border-amber-500/30 text-amber-400 py-3 rounded-xl font-black text-[9px] tracking-widest uppercase flex items-center justify-center gap-2">
                               <CheckCircle size={12} /> Reembolso Feito
                             </div>
                           )}
                           
                           {[AppTripState.AGUARDANDO_PAGAMENTO, AppTripState.DISPONIVEL, AppTripState.ACEITO, AppTripState.INDO_COLETA].includes(f.status) && (
                             <button onClick={() => forceStatus(f.id, AppTripState.CANCELADO)} className="bg-transparent hover:bg-red-500/10 text-red-500 py-3 rounded-xl font-black text-[9px] tracking-widest uppercase border border-transparent hover:border-red-500/30 transition-all mt-auto">Abortar Operação</button>
                           )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 p-3 z-40 hidden md:block shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
         <div className="max-w-7xl mx-auto flex justify-between items-center px-8">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Conexão Firebase <span className="text-green-500">Live</span></span>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Credencial Operacional:</p>
               <p className="text-[10px] font-black text-cyan-400 uppercase italic tracking-widest px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">{authUser?.email}</p>
            </div>
         </div>
      </div>
    </div>
  );
}
