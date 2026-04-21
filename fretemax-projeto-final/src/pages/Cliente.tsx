import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Zap, Weight, Truck, Package, MapPin } from 'lucide-react';

export default function Cliente() {
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

  const handleBack = () => {
    setCurrentOrderId(null);
    setStep('form');
  };

  const handleContratar = async () => {
    if (dist <= 0) return alert("Preencha os CEPs.");
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: dist, veiculo: vehicle, valorFinal: valorFormatado,
        origemBairro: coleta.bairro, origemRua: `${coleta.rua}, ${coleta.num}`,
        destinoBairro: entrega.bairro, destinoRua: `${entrega.rua}, ${entrega.num}`,
        peso: carga.peso, tipoCarga: carga.tipo, status: 'pago',
        createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
      setStep('busca');
    } catch (e) { alert("Erro de conexão."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      <nav className="bg-slate-950 p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          {step !== 'form' && <ArrowLeft onClick={handleBack} className="text-white cursor-pointer w-6 h-6 mr-2" />}
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black text-white text-xl italic tracking-tighter uppercase">FRETOGO</span>
        </div>
        <ShieldCheck className="text-green-500 w-5 h-5" />
      </nav>

      <div className="max-w-md mx-auto px-4 mt-4">
        {step === 'busca' ? (
          <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in border border-slate-100">
             {orderData?.status === 'motorista_a_caminho' ? (
               <div>
                 <Truck className="text-green-600 w-12 h-12 mx-auto mb-4" />
                 <h2 className="text-xl font-black italic uppercase">Motorista Confirmado</h2>
                 <div className="mt-6 p-6 bg-slate-900 rounded-3xl text-white">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Contato</p>
                    <p className="text-xl font-black mb-4">{orderData.motoristaNome}</p>
                    <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap}?text=Oi, vi seu frete no FRETOGO!`)} className="w-full bg-green-500 py-4 rounded-xl font-black">WHATSAPP</button>
                 </div>
               </div>
             ) : (
               <div className="py-8 text-center">
                 <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Package className="text-white w-10 h-10" /></div>
                 <h2 className="text-lg font-black italic uppercase">Buscando Motorista...</h2>
                 <p className="text-slate-400 text-sm mt-3 italic font-bold leading-tight">"Aguardando aceite para sua carga de {carga.peso}."</p>
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900 p-5 rounded-3xl text-white border-l-8 border-yellow-400 shadow-lg">
               <p className="text-[10px] font-black uppercase text-yellow-400 mb-1">Logística Instantânea</p>
               <p className="text-base font-bold italic">Preencha os dados para ativar o radar.</p>
            </div>
            <div className="space-y-2">
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200" placeholder="Bairro de Coleta" onChange={e => setColeta({...coleta, bairro: e.target.value})} />
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200" placeholder="CEP Coleta" onChange={e => setColeta({...coleta, cep: e.target.value})} />
            </div>
            <div className="space-y-2">
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200" placeholder="Bairro de Entrega" onChange={e => setEntrega({...entrega, bairro: e.target.value})} />
               <input className="w-full p-4 bg-white rounded-2xl font-bold shadow-sm border border-slate-200" placeholder="CEP Entrega" onChange={e => setEntrega({...entrega, cep: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200" placeholder="Peso (ex: 500kg)" onChange={e => setCarga({...carga, peso: e.target.value})} />
               <input className="p-4 bg-white rounded-2xl font-bold border border-slate-200" placeholder="O que é?" onChange={e => setCarga({...carga, tipo: e.target.value})} />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Veículo</p>
               <select className="w-full font-black text-base bg-transparent outline-none" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  {Object.keys(precos).map(v => <option key={v} value={v}>{v}</option>)}
               </select>
            </div>
            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-center shadow-2xl border-b-8 border-blue-600">
               <p className="text-[11px] font-black uppercase text-blue-400 mb-1 tracking-widest uppercase">Valor Garantido</p>
               <p className="text-5xl font-black text-white italic">{valorFormatado}</p>
            </div>
            <button onClick={handleContratar} disabled={dist <= 0} className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] text-xl shadow-xl active:scale-95 transition-all uppercase italic">CONTRATAR AGORA</button>
          </div>
        )}
      </div>
    </div>
  );
}
