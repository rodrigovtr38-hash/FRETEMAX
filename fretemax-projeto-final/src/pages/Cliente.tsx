import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { MapPin, ArrowLeft, Package, XCircle, CheckCircle2, Loader2, Smartphone } from 'lucide-react';

export default function Cliente() {
  const [coletaRua, setColetaRua] = useState('');
  const [coletaCep, setColetaCep] = useState('');
  const [entregaRua, setEntregaRua] = useState('');
  const [entregaCep, setEntregaCep] = useState('');
  const [company, setCompany] = useState('');
  const [material, setMaterial] = useState('');
  const [weight, setWeight] = useState('');
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [urgent, setUrgent] = useState(false);
  
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [autoDistance, setAutoDistance] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // ESCUTA O STATUS DO PEDIDO
  useEffect(() => {
    if (currentOrderId) {
      const unsub = onSnapshot(collection(db, 'fretes'), (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  // FUNÇÃO DE CÁLCULO QUE IGNORA ERROS DE DIGITAÇÃO
  useEffect(() => {
    const limpo1 = coletaCep.replace(/\D/g, '');
    const limpo2 = entregaCep.replace(/\D/g, '');

    if (limpo1.length === 8 && limpo2.length === 8) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        const fakeKm = Math.floor(Math.random() * 20) + 10;
        setAutoDistance(fakeKm);
        setIsCalculating(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAutoDistance(0);
    }
  }, [coletaCep, entregaCep]);

  const formatarCEP = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8);
    return v.substring(0, 9);
  };

  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  const valorBase = (20 + (autoDistance * multiplicador)) * 1.20;
  const valorFinal = urgent ? valorBase * 1.30 : valorBase;
  const valorFormatado = autoDistance > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handlePagar = async () => {
    if (autoDistance <= 0) return;
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: coletaRua || coletaCep,
        cidadeDestino: entregaRua || entregaCep,
        distancia: autoDistance,
        veiculo: vehicle,
        responsavel: company || 'Particular',
        material: material || 'Geral',
        peso: weight || 'N/A',
        urgente: urgent,
        valorFinal: valorFormatado,
        status: 'aguardando_motorista',
        createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
    } catch (e) {
      alert("Erro ao enviar. Verifique sua internet.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b p-4 flex items-center gap-4 max-w-2xl mx-auto shadow-sm">
        <button onClick={() => currentOrderId ? setCurrentOrderId(null) : window.location.href = '/'} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <span className="font-black text-blue-600 text-xl italic tracking-tighter">FRETEMAX</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6 pb-12">
        {currentOrderId ? (
          <div className="bg-white rounded-[2.5rem] border shadow-2xl p-10 text-center animate-in fade-in zoom-in">
            {orderData?.status === 'motorista_a_caminho' ? (
              <div className="animate-in slide-in-from-bottom duration-500">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-slate-800 italic uppercase">Motorista Aceitou!</h2>
                <div className="mt-8 p-8 bg-blue-50 rounded-3xl border-2 border-blue-100">
                   <p className="text-blue-600 font-black text-2xl uppercase mb-6">{orderData.motoristaNome}</p>
                   <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}`)} className="w-full bg-green-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl text-lg hover:bg-green-600">
                     <Smartphone className="w-6 h-6" /> CHAMAR NO WHATSAPP
                   </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                  <MapPin className="relative w-24 h-24 text-blue-600 mx-auto" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">Procurando Motorista...</h2>
                <p className="text-slate-400 mt-2 font-medium">Seu pedido de {vehicle} está no radar.</p>
                <button onClick={() => setCurrentOrderId(null)} className="mt-12 text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 w-full opacity-50 hover:opacity-100">
                  <XCircle className="w-5 h-5" /> Cancelar Pedido
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2 border-b pb-4 border-slate-50">
                <Package className="text-blue-600 w-5 h-5"/>
                <h2 className="font-black text-slate-400 text-xs uppercase tracking-widest">Solicitar Frete</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Rua de Coleta" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
              <input className="w-full p-4 border rounded-2xl text-sm font-bold bg-slate-50" placeholder="CEP Coleta" value={coletaCep} onChange={e => setColetaCep(formatarCEP(e.target.value))} maxLength={9} />
              <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Rua de Entrega" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
              <input className="w-full p-4 border rounded-2xl text-sm font-bold bg-slate-50" placeholder="CEP Entrega" value={entregaCep} onChange={e => setEntregaCep(formatarCEP(e.target.value))} maxLength={9} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <p className="text-[10px] font-bold opacity-50 uppercase">Distância</p>
                <p className="text-xl font-black">{isCalculating ? '...' : `${autoDistance} KM`}</p>
              </div>
              <select className="w-full p-4 border rounded-2xl text-sm bg-white font-black" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option>Carro Pequeno</option><option>Utilitário</option><option>Caminhão 3/4</option><option>Carreta</option>
              </select>
            </div>
            <div className="border-t pt-6 space-y-4">
               <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Responsável / Empresa" value={company} onChange={e => setCompany(e.target.value)} />
               <div className="grid grid-cols-2 gap-4">
                  <input className="w-full p-4 border rounded-2xl text-sm" placeholder="O que vai levar?" value={material} onChange={e => setMaterial(e.target.value)} />
                  <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} />
               </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="w-5 h-5 accent-orange-600" />
              <span className="text-sm font-black text-orange-800 uppercase italic">Urgente (+30%)</span>
            </div>
            <div className="bg-blue-600 p-8 rounded-3xl text-center text-white shadow-2xl shadow-blue-100">
               <p className="text-xs font-bold uppercase opacity-70 mb-1">Valor Total</p>
               <p className="text-5xl font-black tracking-tighter">{valorFormatado}</p>
            </div>
            <button onClick={handlePagar} disabled={autoDistance <= 0 || isCalculating} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl hover:bg-black active:scale-95 transition-all text-xl shadow-xl disabled:bg-slate-200">
              {isCalculating ? <Loader2 className="animate-spin mx-auto" /> : "CHAMAR MOTORISTA AGORA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
