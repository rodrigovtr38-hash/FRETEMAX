import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { MapPin, ArrowLeft, Package, CheckCircle2, Smartphone, ShieldCheck, Zap, Weight, Truck } from 'lucide-react';

export default function Cliente() {
  const [step, setStep] = useState('home'); // home, calculo, pagamento
  const [coleta, setColeta] = useState({ cep: '', rua: '', num: '' });
  const [entrega, setEntrega] = useState({ cep: '', rua: '', num: '' });
  const [carga, setCarga] = useState({ peso: '', tipo: '' });
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [autoDistance, setAutoDistance] = useState(0);

  useEffect(() => {
    if (currentOrderId) {
      const unsub = onSnapshot(collection(db, 'fretes'), (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  useEffect(() => {
    if (coleta.cep.length === 8 && entrega.cep.length === 8) {
      setAutoDistance(Math.floor(Math.random() * 20) + 15);
    }
  }, [coleta.cep, entrega.cep]);

  const valorFinal = (25 + (autoDistance * 3.5)) * 1.15;
  const valorFormatado = autoDistance > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handleContratar = async () => {
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: autoDistance,
        veiculo: vehicle,
        valorFinal: valorFormatado,
        coleta: `${coleta.rua}, ${coleta.num} (CEP: ${coleta.cep})`,
        entrega: `${entrega.rua}, ${entrega.num} (CEP: ${entrega.cep})`,
        peso: carga.peso,
        tipoCarga: carga.tipo,
        status: 'pago', // SIMULANDO PAGAMENTO APROVADO PARA TESTE
        createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
      setStep('pagamento');
    } catch (e) { alert("Erro ao processar."); }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <nav className="bg-slate-950 p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          {step !== 'home' && <ArrowLeft onClick={() => setStep('home')} className="text-white mr-2 cursor-pointer" />}
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black text-white text-2xl italic tracking-tighter uppercase">FRETOGO</span>
        </div>
        <div className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
          <ShieldCheck className="text-green-500 w-4 h-4" />
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 mt-6 pb-10">
        {currentOrderId ? (
          <div className="bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 p-8 text-center animate-in zoom-in">
             {orderData?.status === 'motorista_a_caminho' ? (
               <div>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-black italic uppercase">Motorista a Caminho!</h2>
                  <div className="mt-6 p-6 bg-white rounded-3xl shadow-xl border-b-8 border-green-500">
                    <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Seu Condutor</p>
                    <p className="text-xl font-black text-slate-900 mb-4">{orderData.motoristaNome}</p>
                    <button 
                      onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}?text=Olá, sou seu cliente do Fretogo!`)} 
                      className="w-full bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"
                    >
                      <Smartphone /> CHAMAR NO WHATSAPP
                    </button>
                  </div>
               </div>
             ) : (
               <div className="py-10">
                 <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                   <Package className="text-white w-10 h-10" />
                 </div>
                 <h2 className="text-xl font-black italic uppercase">Buscando Motorista...</h2>
                 <p className="text-slate-500 text-sm mt-2 italic">"Pagamento confirmado. Sua carga já está no radar de 14 motoristas."</p>
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-3xl text-white border-l-8 border-yellow-400">
               <p className="text-[10px] font-black uppercase text-yellow-400">Logística em tempo real</p>
               <p className="font-bold text-sm italic">Preencha os detalhes para garantir o melhor preço.</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase ml-2 text-slate-400">Onde Coletar?</p>
              <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none" placeholder="Rua e Número" onChange={e => setColeta({...coleta, rua: e.target.value})} />
              <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none" placeholder="CEP de Coleta" onChange={e => setColeta({...coleta, cep: e.target.value})} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase ml-2 text-slate-400">Onde Entregar?</p>
              <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none" placeholder="Rua e Número" onChange={e => setEntrega({...entrega, rua: e.target.value})} />
              <input className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none" placeholder="CEP de Entrega" onChange={e => setEntrega({...entrega, cep: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-2">
                <Weight className="w-4 h-4 text-blue-600" />
                <input className="bg-transparent w-full font-bold border-none text-sm" placeholder="Peso (kg)" onChange={e => setCarga({...carga, peso: e.target.value})} />
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <input className="bg-transparent w-full font-bold border-none text-sm" placeholder="Tipo Carga" onChange={e => setCarga({...carga, tipo: e.target.value})} />
              </div>
            </div>

            <div className="bg-slate-950 p-8 rounded-[2.5rem] text-center shadow-2xl border-b-8 border-blue-600">
               <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">Valor Garantido FRETOGO</p>
               <p className="text-5xl font-black text-white italic">{valorFormatado}</p>
            </div>

            <button onClick={handleContratar} disabled={autoDistance <= 0} className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl text-xl shadow-2xl active:scale-95 transition-all">
              RESERVAR MOTORISTA AGORA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
