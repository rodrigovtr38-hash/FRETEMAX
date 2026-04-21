import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, ShieldCheck, Zap, Weight, Truck, MapPin, Package } from 'lucide-react';

export default function Cliente() {
  const [step, setStep] = useState('form'); // form, busca
  const [coleta, setColeta] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [entrega, setEntrega] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [carga, setCarga] = useState({ peso: '', tipo: '' });
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [distancia, setDistancia] = useState(0);

  // TABELA DE PREÇOS POR VEÍCULO (MULTIPLICADOR)
  const precos: any = {
    'Carro Pequeno': 1.0,
    'Utilitário / Fiorino': 1.5,
    'Caminhão Toco': 2.8,
    'Caminhão Truck': 3.5,
    'Carreta 30 Ton': 5.0
  };

  useEffect(() => {
    if (coleta.cep.length === 8 && entrega.cep.length === 8) {
      const d = Math.floor(Math.random() * 30) + 10; // Simula distância
      setDistancia(d);
    } else { setDistancia(0); }
  }, [coleta.cep, entrega.cep]);

  const valorBase = 30 + (distancia * 4);
  const valorFinal = valorBase * precos[vehicle];
  const valorFormatado = distancia > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handleContratar = async () => {
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia, veiculo: vehicle, valorFinal: valorFormatado,
        origem: `${coleta.rua}, ${coleta.num} - ${coleta.bairro}`,
        destino: `${entrega.rua}, ${entrega.num} - ${entrega.bairro}`,
        peso: carga.peso, tipoCarga: carga.tipo, status: 'pago', // Teste direto
        createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
      setStep('busca');
    } catch (e) { alert("Erro ao salvar."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      <nav className="bg-slate-950 p-5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          {step === 'busca' && <ArrowLeft onClick={() => setStep('form')} className="text-white cursor-pointer" />}
          <Zap className="text-yellow-400 w-7 h-7 fill-yellow-400" />
          <span className="font-black text-white text-2xl italic tracking-tighter uppercase">FRETOGO</span>
        </div>
        <ShieldCheck className="text-green-500 w-6 h-6" />
      </nav>

      <div className="max-w-md mx-auto px-4 mt-6">
        {step === 'busca' ? (
          <div className="bg-white rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in">
             {orderData?.status === 'motorista_a_caminho' ? (
               <div className="animate-in slide-in-from-bottom">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="text-green-600 w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase text-slate-800">Motorista Confirmado</h2>
                 <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Seu Condutor</p>
                    <p className="text-2xl font-black italic mb-6">{orderData.motoristaNome}</p>
                    <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}?text=Olá, sou seu cliente FRETOGO!`)} className="w-full bg-green-500 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2">
                       <Zap className="fill-white w-5 h-5" /> CHAMAR NO WHATSAPP
                    </button>
                 </div>
               </div>
             ) : (
               <div className="py-10">
                 <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-2xl">
                    <Package className="text-white w-12 h-12" />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase">Buscando Motorista...</h2>
                 <p className="text-slate-500 font-bold mt-4 px-4 italic">"Sua carga de {carga.peso}kg está no radar de motoristas de {vehicle}."</p>
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-slate-900 p-6 rounded-[2rem] text-white border-l-[10px] border-yellow-400 shadow-xl">
               <p className="text-[11px] font-black uppercase text-yellow-400 tracking-widest">Calculadora de Cargas</p>
               <p className="text-lg font-bold italic leading-tight">Defina sua carga e o veículo ideal.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <input className="w-full p-5 bg-white rounded-2xl font-bold shadow-sm text-lg border-2 border-slate-100 focus:border-blue-500 outline-none" placeholder="Bairro e Cidade de Coleta" onChange={e => setColeta({...coleta, bairro: e.target.value})} />
               <input className="w-full p-5 bg-white rounded-2xl font-bold shadow-sm text-lg border-2 border-slate-100" placeholder="CEP de Coleta (Apenas Números)" onChange={e => setColeta({...coleta, cep: e.target.value})} />
               <div className="h-2 w-full border-b-2 border-dashed border-slate-200 my-2"></div>
               <input className="w-full p-5 bg-white rounded-2xl font-bold shadow-sm text-lg border-2 border-slate-100" placeholder="Bairro e Cidade de Entrega" onChange={e => setEntrega({...entrega, bairro: e.target.value})} />
               <input className="w-full p-5 bg-white rounded-2xl font-bold shadow-sm text-lg border-2 border-slate-100" placeholder="CEP de Entrega" onChange={e => setEntrega({...entrega, cep: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Peso da Carga</p>
                  <input className="w-full font-black text-lg bg-transparent border-none outline-none" placeholder="Ex: 500kg" onChange={e => setCarga({...carga, peso: e.target.value})} />
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">O que é?</p>
                  <input className="w-full font-black text-lg bg-transparent border-none outline-none" placeholder="Ex: Móveis" onChange={e => setCarga({...carga, tipo: e.target.value})} />
               </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-slate-100">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Selecione o Veículo</p>
               <select className="w-full font-black text-lg bg-transparent border-none outline-none cursor-pointer" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  <option>Carro Pequeno</option>
                  <option>Utilitário / Fiorino</option>
                  <option>Caminhão Toco</option>
                  <option>Caminhão Truck</option>
                  <option>Carreta 30 Ton</option>
               </select>
            </div>

            <div className="bg-slate-950 p-10 rounded-[3rem] text-center shadow-2xl border-b-[12px] border-blue-600">
               <p className="text-[11px] font-black uppercase text-blue-400 mb-2 tracking-[0.2em]">Cotação Instantânea</p>
               <p className="text-6xl font-black text-white italic tracking-tighter">{valorFormatado}</p>
            </div>

            <button onClick={handleContratar} disabled={distancia <= 0} className="w-full bg-blue-600 text-white font-black py-7 rounded-[2rem] text-2xl shadow-2xl active:scale-95 transition-all uppercase italic">
              RESERVAR AGORA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
