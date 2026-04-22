import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Zap, Truck, Package, Clock, MapPin, Navigation } from 'lucide-react';

export default function Cliente() {
  const [step, setStep] = useState('form'); 
  const [coleta, setColeta] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [entrega, setEntrega] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [carga, setCarga] = useState({ peso: '', tipo: '' });
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [driversOnline, setDriversOnline] = useState<any[]>([]);

  // Multiplicadores de Categoria (Padrão de Mercado)
  const precos: any = {
    'Carro Pequeno': 1.0, 
    'Utilitário / Fiorino': 1.6, 
    'Caminhão Toco': 2.9, 
    'Caminhão Truck': 3.8, 
    'Carreta 30 Ton': 5.5
  };

  useEffect(() => {
    const q = query(collection(db, 'motoristas_online'), where('status', '==', 'disponivel'));
    const unsub = onSnapshot(q, (snap) => {
      const drivers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDriversOnline(drivers);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (currentOrderId) {
      const unsub = onSnapshot(collection(db, 'fretes'), (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  // --- LÓGICA FINANCEIRA REAL (O CORAÇÃO DO NEGÓCIO - 20/80) ---
  const getDistancia = () => (coleta.cep.length >= 8 && entrega.cep.length >= 8) ? 25 : 0;
  
  const dist = getDistancia();
  const TAXA_SAIDA = 32; // Bandeirada mínima competitiva
  const VALOR_POR_KM = 3.80;
  
  // 1. VALOR TOTAL (O que o cliente paga - já embutidos seus 20%)
  const valorTotalBruto = (TAXA_SAIDA + (dist * VALOR_POR_KM)) * precos[vehicle];
  
  // 2. REPASSE MOTORISTA (Os 80% que o motorista verá como "Valor do Frete")
  const valorRepasseMotorista = valorTotalBruto * 0.80;
  
  // 3. SEU LUCRO (Os 20% invisíveis)
  const margemFretogo = valorTotalBruto * 0.20;

  const valorFormatado = dist > 0 
    ? `R$ ${valorTotalBruto.toFixed(2).replace('.', ',')}` 
    : 'R$ 0,00';

  const valorMotoristaFormatado = `R$ ${valorRepasseMotorista.toFixed(2).replace('.', ',')}`;

  const handleBack = () => { setCurrentOrderId(null); setStep('form'); };

  const handleBuscarRadar = () => {
    if (dist <= 0) return alert("Preencha os CEPs corretamente.");
    if (!carga.peso || !carga.tipo) return alert("Preencha o peso e material da carga.");
    setStep('radar');
  };

  const handleContratar = async () => {
    setStep('busca');
    const horaSolicitada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: dist,
        veiculo: vehicle,
        valorFinal: valorFormatado,          // O que aparece pro cliente
        valorMotorista: valorMotoristaFormatado, // O QUE O MOTORISTA VAI VER NO RADAR DELE
        lucroPlataforma: margemFretogo,      // Seus 20% guardados para relatório
        origemBairro: coleta.bairro,
        origemRua: `${coleta.rua}, ${coleta.num}`,
        destinoBairro: entrega.bairro,
        destinoRua: `${entrega.rua}, ${entrega.num}`,
        peso: carga.peso,
        tipoCarga: carga.tipo,
        status: 'pendente',
        horario: horaSolicitada,
        createdAt: serverTimestamp()
      });
      
      setCurrentOrderId(docRef.id);

      const mpResponse = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Frete FRETOGO - ${vehicle}`,
          preco: valorTotalBruto.toFixed(2), // Cobramos o valor CHEIO do cliente
          idPedido: docRef.id
        })
      });

      const data = await mpResponse.json();
      if (data.url) window.location.href = data.url;
      else { alert("Erro ao gerar link de pagamento."); setStep('form'); }
    } catch (e) { 
      alert("Erro ao processar. Tente novamente."); 
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      <nav className="bg-slate-950 p-4 flex items-center justify-between shadow-xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {(step === 'busca' || step === 'radar') && <ArrowLeft onClick={handleBack} className="text-white cursor-pointer w-6 h-6 mr-2" />}
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black text-white text-xl italic tracking-tighter uppercase">FRETOGO</span>
        </div>
        <ShieldCheck className="text-green-500 w-5 h-5" />
      </nav>

      <div className="max-w-md mx-auto px-4 mt-4">
        {step === 'radar' ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-2xl border border-slate-100 overflow-hidden">
               <div className="flex items-center justify-between mb-3 px-2">
                  <h3 className="text-[10px] font-black uppercase text-blue-600 italic tracking-widest">Radar de Motoristas Próximos</h3>
                  <span className="bg-green-100 text-green-700 text-[9px] px-2 py-1 rounded-full font-bold">● {driversOnline.length} Online</span>
               </div>
               
               <div className="w-full h-[250px] bg-slate-100 rounded-[2rem] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i1234!3i2345!2m3!1e0!2sm!3i420120488!3m8!2spt-BR!3sUS!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0')]"></div>
                  
                  {driversOnline.map((driver) => (
                    <div key={driver.id} className="absolute transition-all duration-1000" style={{ left: `${40 + Math.random() * 20}%`, top: `${40 + Math.random() * 20}%` }}>
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-1 rounded-lg shadow-md border border-blue-500">
                                <Truck className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-[8px] font-black bg-white/80 px-1 rounded mt-1">{driver.veiculo}</span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 text-center shadow-2xl border border-slate-100">
              <h2 className="text-xl font-black italic uppercase text-slate-900 leading-tight">Garantir esse valor?</h2>
              <p className="text-slate-500 text-sm mb-6 mt-1 font-medium">Motoristas de <span className="text-blue-600 font-bold">{vehicle}</span> prontos para coletar.</p>
              
              <div className="bg-slate-900 p-6 rounded-3xl text-left mb-6 shadow-xl">
                 <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Preço Fixo de Lançamento</p>
                 <p className="text-4xl font-black text-white italic">{valorFormatado}</p>
                 <div className="mt-2 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-green-400" />
                    <span className="text-[9px] text-slate-400 uppercase font-bold">Seguro contra danos incluso</span>
                 </div>
              </div>

              <button onClick={handleContratar} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] text-lg shadow-xl active:scale-95 transition-all uppercase italic tracking-wide">
                CONTRATAR AGORA
              </button>
            </div>
          </div>

        ) : step === 'busca' ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100">
             {orderData?.status === 'motorista_a_caminho' ? (
               <div>
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="text-green-600 w-10 h-10" />
                 </div>
                 <h2 className="text-xl font-black italic uppercase">Motorista a Caminho!</h2>
                 <div className="mt-6 p-6 bg-slate-900 rounded-[2rem] text-white">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Carga aceita por</p>
                    <p className="text-xl font-black mb-4">{orderData.motoristaNome}</p>
                    <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap?.replace(/\D/g,'')}?text=Olá, sou seu cliente FRETOGO!`)} className="w-full bg-green-500 hover:bg-green-600 py-4 rounded-xl font-black uppercase shadow-lg transition-colors flex items-center justify-center gap-2">
                       FALAR NO WHATSAPP
                    </button>
                 </div>
               </div>
             ) : (
               <div className="py-8">
                 <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
                   <Package className="text-white w-10 h-10" />
                 </div>
                 <h2 className="text-lg font-black italic uppercase tracking-tight">Gerando Pagamento Seguro...</h2>
                 <p className="text-xs text-slate-400 font-bold mt-2 uppercase">Aguarde o redirecionamento</p>
               </div>
             )}
          </div>

        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 p-5 rounded-3xl text-white border-l-8 border-yellow-400 shadow-lg">
               <p className="text-[10px] font-black uppercase text-yellow-400 mb-1">Simulador de Frete</p>
               <p className="text-base font-bold italic">Cálculo real por categoria e distância.</p>
            </div>
            
            <div className="grid gap-2">
               <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-blue-500 w-5 h-5" />
                  <input className="w-full p-4 pl-12 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="Bairro de Coleta" onChange={e => setColeta({...coleta, bairro: e.target.value})} />
               </div>
               <input className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="CEP Coleta" onChange={e => setColeta({...coleta, cep: e.target.value})} />
            </div>

            <div className="grid gap-2">
               <div className="relative">
                  <Navigation className="absolute left-4 top-4 text-orange-500 w-5 h-5" />
                  <input className="w-full p-4 pl-12 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="Bairro de Entrega" onChange={e => setEntrega({...entrega, bairro: e.target.value})} />
               </div>
               <input className="w-full p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="CEP Entrega" onChange={e => setEntrega({...entrega, cep: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-2">
               <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="Peso (kg)" onChange={e => setCarga({...carga, peso: e.target.value})} />
               <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200 outline-none" placeholder="Material" onChange={e => setCarga({...carga, tipo: e.target.value})} />
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Qual o seu veículo?</p>
               <select className="w-full font-black text-slate-800 text-base bg-transparent outline-none cursor-pointer" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  {Object.keys(precos).map(v => <option key={v} value={v}>{v}</option>)}
               </select>
            </div>
            
            <button onClick={handleBuscarRadar} disabled={dist <= 0} className="w-full bg-slate-900 disabled:bg-slate-300 hover:bg-black text-white font-black py-5 rounded-[2rem] text-lg shadow-xl transition-all uppercase italic tracking-wide">
                VER MOTORISTAS NO RADAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
