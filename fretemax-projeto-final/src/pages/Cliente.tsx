import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Zap, Truck, Package, Clock, MapPin } from 'lucide-react';

export default function Cliente() {
  // Novo estado adicionado: 'radar'
  const [step, setStep] = useState('form'); 
  const [coleta, setColeta] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [entrega, setEntrega] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [carga, setCarga] = useState({ peso: '', tipo: '' });
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  const precos: any = {
    'Carro Pequeno': 1.0, 'Utilitário / Fiorino': 1.6, 'Caminhão Toco': 2.9, 'Caminhão Truck': 3.8, 'Carreta 30 Ton': 5.5
  };

  useEffect(() => {
    if (currentOrderId) {
      const unsub = onSnapshot(collection(db, 'fretes'), (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  const getDistancia = () => (coleta.cep.length >= 8 && entrega.cep.length >= 8) ? 25 : 0;
  const dist = getDistancia();
  const valorBase = 35 + (dist * 4.2);
  const total = valorBase * precos[vehicle];
  const valorFormatado = dist > 0 ? `R$ ${total.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handleBack = () => { setCurrentOrderId(null); setStep('form'); };

  // ETAPA INTERMEDIÁRIA: Mostrar o Radar
  const handleBuscarRadar = () => {
    if (dist <= 0) return alert("Preencha os CEPs corretamente.");
    if (!carga.peso || !carga.tipo) return alert("Preencha o peso e material da carga.");
    setStep('radar');
  };

  // ETAPA DE PAGAMENTO: Só roda depois que ancorou o desejo no Radar
  const handleContratar = async () => {
    setStep('busca'); // Tela de carregamento do Mercado Pago
    const horaSolicitada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: dist, veiculo: vehicle, valorFinal: valorFormatado,
        origemBairro: coleta.bairro, origemRua: `${coleta.rua}, ${coleta.num}`,
        destinoBairro: entrega.bairro, destinoRua: `${entrega.rua}, ${entrega.num}`,
        peso: carga.peso, tipoCarga: carga.tipo, status: 'pendente',
        horario: horaSolicitada,
        createdAt: serverTimestamp()
      });
      
      setCurrentOrderId(docRef.id);

      const mpResponse = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Frete FRETOGO - ${vehicle}`,
          preco: total, 
          idPedido: docRef.id
        })
      });

      const data = await mpResponse.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erro ao gerar link de pagamento.");
        setStep('form');
      }

    } catch (e) { 
      alert("Erro ao processar pagamento. Tente novamente."); 
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      <nav className="bg-slate-950 p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          {(step === 'busca' || step === 'radar') && <ArrowLeft onClick={handleBack} className="text-white cursor-pointer w-6 h-6 mr-2" />}
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black text-white text-xl italic tracking-tighter uppercase">FRETOGO</span>
        </div>
        <ShieldCheck className="text-green-500 w-5 h-5" />
      </nav>

      <div className="max-w-md mx-auto px-4 mt-4">
        {step === 'radar' ? (
          /* TELA 2: RADAR DE DESEJO E GATILHO MENTAL */
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute w-full h-full border-4 border-blue-400 rounded-full animate-ping opacity-20"></div>
                <MapPin className="text-blue-600 w-10 h-10 animate-bounce" />
             </div>
             <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tight">Motorista Encontrado!</h2>
             <p className="text-slate-600 font-medium mb-6 mt-2">
               Temos motoristas com <strong className="text-blue-600">{vehicle}</strong> a poucos minutos da sua coleta.
             </p>
             
             <div className="bg-slate-900 p-6 rounded-3xl text-left mb-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600 rounded-bl-full opacity-20"></div>
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Valor Final Fechado</p>
                <p className="text-4xl font-black text-white italic mb-3">{valorFormatado}</p>
                <div className="flex items-center gap-2 border-t border-slate-700 pt-3">
                   <ShieldCheck className="w-4 h-4 text-green-400" />
                   <p className="text-xs text-slate-300 font-medium">Pagamento retido pelo app. 100% seguro.</p>
                </div>
             </div>

             <button onClick={handleContratar} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] text-lg shadow-xl active:scale-95 transition-all uppercase italic tracking-wide">
                GARANTIR MOTORISTA AGORA
             </button>
          </div>

        ) : step === 'busca' ? (
          /* TELA 3 e 4: CARREGAMENTO DO MP OU SUCESSO E WHATSAPP */
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-100">
             {orderData?.status === 'motorista_a_caminho' ? (
               <div>
                 <Truck className="text-green-600 w-12 h-12 mx-auto mb-4" />
                 <h2 className="text-xl font-black italic uppercase">Motorista Confirmado</h2>
                 <div className="mt-6 p-6 bg-slate-900 rounded-3xl text-white">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Seu Motorista</p>
                    <p className="text-xl font-black mb-4">{orderData.motoristaNome}</p>
                    <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}?text=Olá, sou seu cliente FRETOGO!`)} className="w-full bg-green-500 hover:bg-green-600 py-4 rounded-xl font-black uppercase shadow-lg shadow-green-900/50 transition-colors">
                       FALAR NO WHATSAPP
                    </button>
                 </div>
               </div>
             ) : (
               <div className="py-8">
                 <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg shadow-blue-200">
                   <Package className="text-white w-10 h-10" />
                 </div>
                 <h2 className="text-lg font-black italic uppercase tracking-tight">Gerando Pagamento Seguro...</h2>
                 <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 font-bold text-xs">
                    <Clock className="w-3 h-3" /> AGUARDE O REDIRECIONAMENTO
                 </div>
               </div>
             )}
          </div>

        ) : (
          /* TELA 1: FORMULÁRIO INICIAL (SIMULADOR) */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 p-5 rounded-3xl text-white border-l-8 border-yellow-400 shadow-lg">
               <p className="text-[10px] font-black uppercase text-yellow-400 mb-1">Cálculo de Frete</p>
               <p className="text-base font-bold italic">Preencha os dados da carga.</p>
            </div>
            <div className="space-y-2">
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="Bairro de Coleta" onChange={e => setColeta({...coleta, bairro: e.target.value})} />
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="CEP Coleta" onChange={e => setColeta({...coleta, cep: e.target.value})} />
            </div>
            <div className="space-y-2">
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="Bairro de Entrega" onChange={e => setEntrega({...entrega, bairro: e.target.value})} />
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" placeholder="CEP Entrega" onChange={e => setEntrega({...entrega, cep: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200 focus:border-blue-500 outline-none transition-all" placeholder="Peso (kg)" onChange={e => setCarga({...carga, peso: e.target.value})} />
               <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200 focus:border-blue-500 outline-none transition-all" placeholder="Material (Ex: Caixas)" onChange={e => setCarga({...carga, tipo: e.target.value})} />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Veículo Ideal</p>
               <select className="w-full font-black text-slate-800 text-base bg-transparent outline-none cursor-pointer" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  {Object.keys(precos).map(v => <option key={v} value={v}>{v}</option>)}
               </select>
            </div>
            
            <button onClick={handleBuscarRadar} disabled={dist <= 0} className="w-full bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 hover:bg-black text-white font-black py-5 rounded-[2rem] text-lg shadow-xl active:scale-95 transition-all uppercase italic tracking-wide">
               BUSCAR MOTORISTA PRÓXIMO
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
