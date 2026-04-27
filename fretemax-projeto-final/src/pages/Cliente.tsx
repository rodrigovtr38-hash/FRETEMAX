import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Zap, Truck, Package, MapPin, Navigation, XCircle, RefreshCw, Loader2 } from 'lucide-react';

export default function Cliente() {
  const [step, setStep] = useState('form'); 
  const [loadingPay, setLoadingPay] = useState(false);
  const [coleta, setColeta] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [entrega, setEntrega] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [carga, setCarga] = useState({ peso: '', tipo: '' });
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const precos: any = { 'Carro Pequeno': 1.0, 'Utilitário / Fiorino': 1.6, 'Caminhão Toco': 2.9, 'Caminhão Truck': 3.8, 'Carreta 30 Ton': 5.5 };
  
  // Distância fake provisória para não quebrar (No próximo passo o Google Maps calculará isso)
  const dist = (coleta.cep.length >= 8 && entrega.cep.length >= 8) ? 25 : 0;
  
  const valorTotalBruto = (32 + (dist * 3.80)) * precos[vehicle];
  const valorRepasseMotorista = valorTotalBruto * 0.80;
  const margemFretogo = valorTotalBruto * 0.20;

  // PWA Install
  useEffect(() => {
    const handleBeforeInstall = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = () => { if (deferredPrompt) { deferredPrompt.prompt(); setDeferredPrompt(null); } };

  // Recupera o ID do Pedido caso o usuário dê F5 na página
  useEffect(() => {
    const savedOrderId = localStorage.getItem('fretogo_current_order');
    if (savedOrderId && !currentOrderId) {
      setCurrentOrderId(savedOrderId);
      setStep('busca');
    }
  }, [currentOrderId]);

  // Escuta o Firestore (A Fonte da Verdade)
  useEffect(() => {
    if (!currentOrderId) return;
    
    const unsub = onSnapshot(doc(db, 'fretes', currentOrderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrderData(data);
        
        // Limpa o cache local se o pedido terminar
        if (['finalizado', 'cancelado', 'erro_pagamento'].includes(data.status)) {
            localStorage.removeItem('fretogo_current_order');
        }
      }
    }, (error) => {
        console.error("Erro ao ler o frete:", error);
    });

    return () => unsub();
  }, [currentOrderId]);

  const handleContratar = async () => {
    if (loadingPay || dist <= 0) return;
    setLoadingPay(true);
    setStep('busca');
    
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: dist, veiculo: vehicle,
        valorTotal: Number(valorTotalBruto.toFixed(2)),
        valorMotorista: Number(valorRepasseMotorista.toFixed(2)),
        lucroPlataforma: Number(margemFretogo.toFixed(2)),
        valorFormatado: `R$ ${valorTotalBruto.toFixed(2).replace('.', ',')}`,
        cidadeOrigem: coleta.bairro, origemRua: `${coleta.rua}, ${coleta.num}`,
        cidadeDestino: entrega.bairro, destinoRua: `${entrega.rua}, ${entrega.num}`,
        peso: carga.peso, material: carga.tipo,
        status: 'aguardando_pagamento',
        logs: [{ tipo: 'criado', data: new Date().toISOString() }],
        createdAt: serverTimestamp()
      });
      
      setCurrentOrderId(docRef.id);
      localStorage.setItem('fretogo_current_order', docRef.id);

      const res = await fetch('/api/pagamento', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: `Frete FRETOGO - ${vehicle}`, preco: valorTotalBruto.toFixed(2), idPedido: docRef.id })
      });
      const data = await res.json();
      
      if (data.url) window.location.href = data.url;
      else throw new Error("Sem URL do Mercado Pago");
      
    } catch (e) { 
      alert("Falha ao processar requisição de pagamento. Tente novamente."); 
      setStep('form'); 
      setLoadingPay(false); 
      localStorage.removeItem('fretogo_current_order');
      setCurrentOrderId(null);
    }
  };

  const handleReset = () => { 
      setStep('form'); 
      setCurrentOrderId(null); 
      setLoadingPay(false); 
      setOrderData(null); 
      localStorage.removeItem('fretogo_current_order');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      {deferredPrompt && (
        <div className="bg-blue-600 p-3 flex items-center justify-between px-6 sticky top-0 z-[60] shadow-lg">
          <span className="text-[10px] font-bold text-white uppercase">Baixar App FreteGO</span>
          <button onClick={handleInstallPWA} className="bg-white text-blue-600 text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-sm">Instalar</button>
        </div>
      )}
      
      <nav className="bg-slate-950 p-4 flex items-center justify-between shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-2 text-white">
          {(step === 'busca') && <ArrowLeft onClick={handleReset} className="cursor-pointer w-6 h-6 mr-2 active:scale-90 transition-transform" />}
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black text-xl italic uppercase tracking-tighter">FRETOGO</span>
        </div>
        <ShieldCheck className="text-green-500 w-5 h-5" />
      </nav>

      <div className="max-w-md mx-auto px-4 mt-4">
        {step === 'busca' ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100">
            {orderData?.status === 'erro_pagamento' ? (
              <div className="animate-in fade-in">
                <XCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-black uppercase text-slate-900">Pagamento Recusado</h2>
                <button onClick={handleReset} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black mt-6 flex gap-2 justify-center shadow-lg active:scale-95 transition-transform">
                  <RefreshCw className="w-4 h-4" /> TENTAR NOVAMENTE
                </button>
              </div>
            ) : ['aceito', 'coleta', 'em_transporte', 'entregue', 'aguardando_repasse', 'finalizado'].includes(orderData?.status) ? (
              <div className="animate-in zoom-in">
                <Truck className="text-green-600 w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-black italic uppercase text-slate-900">Carga Segura!</h2>
                <div className="mt-4 space-y-1 text-sm font-bold text-slate-500">
                  {orderData.status === 'aceito' && <p>📦 Indo até o local de coleta.</p>}
                  {orderData.status === 'coleta' && <p>🚚 Carga coletada com sucesso.</p>}
                  {orderData.status === 'em_transporte' && <p>🛣️ Em rota de entrega.</p>}
                  {['entregue', 'aguardando_repasse', 'finalizado'].includes(orderData.status) && <p className="text-green-500">✅ Entrega Concluída!</p>}
                </div>
                <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] text-white shadow-inner">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Motorista</p>
                  <p className="text-2xl font-black mb-4">{orderData.motoristaNome}</p>
                  <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap?.replace(/\D/g,'')}?text=Olá, sou seu cliente do FRETOGO!`)} className="w-full bg-green-500 py-4 rounded-xl font-black uppercase italic shadow-lg active:scale-95 transition-transform">WHATSAPP</button>
                </div>
              </div>
            ) : (
              <div className="py-8">
                {orderData?.status === 'aguardando_motorista' ? <Package className="text-blue-600 w-12 h-12 mx-auto mb-6 animate-bounce" /> : <Loader2 className="text-blue-600 w-12 h-12 mx-auto mb-6 animate-spin" />}
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
                    {orderData?.status === 'aguardando_motorista' ? "Buscando Motoristas..." : "Processando..."}
                </h2>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
             <div className="bg-slate-900 p-5 rounded-3xl text-white border-l-8 border-yellow-400 shadow-lg animate-in fade-in">
               <p className="text-[10px] font-black uppercase text-yellow-400 mb-1">Simulador de Frete</p>
               <p className="text-base font-bold italic">Cálculo real por categoria e distância.</p>
            </div>
             <div className="grid gap-2 animate-in slide-in-from-bottom-4">
               <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-blue-500 w-5 h-5" />
                  <input className="w-full p-4 pl-12 bg-white rounded-2xl font-bold border border-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="Bairro Coleta" onChange={e => setColeta({...coleta, bairro: e.target.value})} />
               </div>
               <input className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none focus:border-blue-500 transition-colors" placeholder="CEP Coleta" onChange={e => setColeta({...coleta, cep: e.target.value})} />
               <div className="relative mt-2">
                  <Navigation className="absolute left-4 top-4 text-orange-500 w-5 h-5" />
                  <input className="w-full p-4 pl-12 bg-white rounded-2xl font-bold border border-slate-200 outline-none focus:border-orange-500 transition-colors" placeholder="Bairro Entrega" onChange={e => setEntrega({...entrega, bairro: e.target.value})} />
               </div>
               <input className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none focus:border-orange-500 transition-colors" placeholder="CEP Entrega" onChange={e => setEntrega({...entrega, cep: e.target.value})} />
               <div className="grid grid-cols-2 gap-2 mt-2">
                   <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="Peso (kg)" onChange={e => setCarga({...carga, peso: e.target.value})} />
                   <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="Material" onChange={e => setCarga({...carga, tipo: e.target.value})} />
               </div>
               <div className="bg-white p-4 rounded-2xl border border-slate-200 mt-2">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Qual o seu veículo?</p>
                   <select className="w-full font-black text-slate-800 text-base bg-transparent outline-none cursor-pointer" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                      {Object.keys(precos).map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
               </div>
            </div>
            <button onClick={handleContratar} disabled={loadingPay || dist <= 0} className="w-full bg-blue-600 disabled:bg-slate-300 text-white font-black py-5 rounded-[2rem] text-lg uppercase italic shadow-xl active:scale-95 transition-all">
               {loadingPay ? 'GERANDO PAGAMENTO...' : 'CONTRATAR AGORA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

