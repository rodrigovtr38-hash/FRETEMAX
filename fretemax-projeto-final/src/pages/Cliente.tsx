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

  useEffect(() => {
    if (currentOrderId) {
      const unsub = onSnapshot(collection(db, 'fretes'), (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  const handleCepChange = (val: string, setter: any) => {
    let v = val.replace(/\D/g, ''); 
    if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8);
    setter(v.slice(0, 9));
    if (v.length === 8) {
      setIsCalculating(true);
      setTimeout(() => { setAutoDistance(Math.floor(Math.random() * 20) + 5); setIsCalculating(false); }, 800);
    }
  };

  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  const valorFinal = (20 + (autoDistance * multiplicador)) * 1.20 * (urgent ? 1.30 : 1);
  const valorFormatado = autoDistance > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handlePagar = async () => {
    if (autoDistance <= 0) return;
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: coletaRua || coletaCep, cidadeDestino: entregaRua || entregaCep,
        distancia: autoDistance, veiculo: vehicle, responsavel: company || 'Particular',
        material: material || 'Geral', peso: weight || 'N/A', urgente: urgent,
        valorFinal: valorFormatado, status: 'aguardando_motorista', createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
    } catch (e) { alert("Erro."); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b p-4 flex items-center gap-4 max-w-2xl mx-auto">
        <button onClick={() => currentOrderId ? setCurrentOrderId(null) : window.location.href = '/'} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <span className="font-black text-blue-600">FRETEMAX</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {currentOrderId ? (
          <div className="bg-white rounded-2xl border shadow-2xl p-8 text-center animate-in fade-in zoom-in">
            {orderData?.status === 'motorista_a_caminho' ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Motorista a Caminho!</h2>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-blue-100">
                   <p className="text-blue-600 font-black text-xl">{orderData.motoristaNome}</p>
                   <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}`)} className="mt-4 w-full bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg">
                     <Smartphone /> Chamar no WhatsApp
                   </button>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                  <MapPin className="relative w-20 h-20 text-blue-600 mx-auto" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Procurando motoristas...</h2>
                <p className="text-slate-400 text-sm mt-2 font-medium italic">Aguardando aceite de um parceiro próximo</p>
                <button onClick={() => setCurrentOrderId(null)} className="mt-10 text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 w-full opacity-60 hover:opacity-100 transition-opacity">
                  <XCircle className="w-4 h-4" /> Cancelar Pedido
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2"><Package className="text-blue-600 w-5 h-5"/><h2 className="font-bold uppercase text-xs tracking-widest text-slate-400">Novo Frete</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="Rua de Coleta" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="CEP de Coleta" value={coletaCep} onChange={e => handleCepChange(e.target.value, setColetaCep)} maxLength={9} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="Rua de Entrega" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="CEP de Entrega" value={entregaCep} onChange={e => handleCepChange(e.target.value, setEntregaCep)} maxLength={9} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Distância Estimada</p>
                <p className="font-black text-slate-700">{isCalculating ? '...' : `${autoDistance} KM`}</p>
              </div>
              <select className="w-full p-3 border rounded-xl text-sm bg-white font-bold" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option>Carro Pequeno</option><option>Utilitário</option><option>Caminhão 3/4</option><option>Carreta</option>
              </select>
            </div>
            <div className="border-t pt-4 space-y-3">
               <input className="w-full p-3 border rounded-xl text-sm" placeholder="Nome do Responsável" value={company} onChange={e => setCompany(e.target.value)} />
               <div className="grid grid-cols-2 gap-3">
                  <input className="w-full p-3 border rounded-xl text-sm" placeholder="O que vai levar?" value={material} onChange={e => setMaterial(e.target.value)} />
                  <input className="w-full p-3 border rounded-xl text-sm" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} />
               </div>
            </div>
            <div className="bg-blue-600 p-6 rounded-2xl text-center text-white shadow-xl shadow-blue-200">
               <p className="text-xs font-bold uppercase opacity-70">Valor do Investimento</p>
               <p className="text-4xl font-black">{valorFormatado}</p>
            </div>
            <button onClick={handlePagar} disabled={autoDistance <= 0 || isCalculating} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black active:scale-95 transition-all">
              {isCalculating ? <Loader2 className="animate-spin mx-auto" /> : "CHAMAR MOTORISTA AGORA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
