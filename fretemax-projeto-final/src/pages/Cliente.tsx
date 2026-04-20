import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { MapPin, ArrowLeft, Download, Car, Package, XCircle, CheckCircle2, Loader2 } from 'lucide-react';

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
      const q = query(collection(db, 'fretes'));
      const unsub = onSnapshot(q, (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  // GATILHO DE KM CORRIGIDO (Considerando o hífen)
  const checarDistancia = () => {
    const c1 = coletaCep.replace(/\D/g, '');
    const c2 = entregaCep.replace(/\D/g, '');
    
    if (c1.length === 8 && c2.length === 8) {
      setIsCalculating(true);
      setTimeout(() => {
        setAutoDistance(Math.floor(Math.random() * 25) + 5);
        setIsCalculating(false);
      }, 1000);
    }
  };

  const formatarCEP = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8);
    return v.substring(0, 9);
  };

  useEffect(() => {
    checarDistancia();
  }, [coletaCep, entregaCep]);

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
    } catch (e) { alert("Erro ao enviar pedido."); }
  };

  if (currentOrderId) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl border shadow-2xl p-8 text-center animate-in fade-in zoom-in">
        {orderData?.status === 'motorista_a_caminho' ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Motorista a Caminho!</h2>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border">
              <p className="text-sm text-slate-500 uppercase font-bold">Parceiro</p>
              <p className="text-lg font-black text-blue-600">{orderData.motoristaNome}</p>
              <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}`)} className="mt-4 w-full bg-green-500 text-white font-bold py-3 rounded-lg">Falar no WhatsApp</button>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
              <MapPin className="relative w-20 h-20 text-blue-600 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Buscando motoristas...</h2>
            <button onClick={() => setCurrentOrderId(null)} className="mt-10 text-red-500 text-sm font-bold w-full flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Cancelar
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <nav className="bg-white border-b p-4 flex justify-between items-center max-w-2xl mx-auto rounded-b-xl">
        <span className="font-black text-blue-600 tracking-tighter">FRETEMAX</span>
        <button onClick={() => window.location.href = '/motorista'} className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-full font-bold">PAINEL MOTORISTA</button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2"><Package className="text-blue-600 w-5 h-5"/><h2 className="font-bold">Novo Frete</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Origem</label>
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="Rua e Número" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="CEP" value={coletaCep} onChange={e => setColetaCep(formatarCEP(e.target.value))} maxLength={9} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Destino</label>
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="Rua e Número" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="CEP" value={entregaCep} onChange={e => setEntregaCep(formatarCEP(e.target.value))} maxLength={9} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">KM Estimado</p>
              <p className="font-black text-slate-700">{isCalculating ? 'Calculando...' : `${autoDistance} KM`}</p>
            </div>
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase">Veículo</label>
               <select className="w-full p-3 border rounded-xl text-sm bg-white font-bold" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  <option>Carro Pequeno</option>
                  <option>Utilitário</option>
                  <option>Caminhão 3/4</option>
                  <option>Carreta</option>
               </select>
            </div>
          </div>
          <div className="border-t pt-4 space-y-3">
             <input className="w-full p-3 border rounded-xl text-sm" placeholder="Nome do Responsável/Empresa" value={company} onChange={e => setCompany(e.target.value)} />
             <div className="grid grid-cols-2 gap-3">
                <input className="w-full p-3 border rounded-xl text-sm" placeholder="Material" value={material} onChange={e => setMaterial(e.target.value)} />
                <input className="w-full p-3 border rounded-xl text-sm" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} />
             </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
            <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="w-4 h-4" />
            <span className="text-xs font-bold text-orange-700">Solicitação Urgente (+30%)</span>
          </div>
          <div className="bg-blue-600 p-6 rounded-2xl text-center text-white">
             <p className="text-[10px] font-bold uppercase opacity-70">Valor Total</p>
             <p className="text-4xl font-black">{valorFormatado}</p>
          </div>
          <button onClick={handlePagar} disabled={autoDistance <= 0 || isCalculating} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black active:scale-95 transition-all flex justify-center items-center">
            {isCalculating ? <Loader2 className="animate-spin" /> : "CHAMAR MOTORISTA AGORA"}
          </button>
        </div>
      </div>
    </div>
  );
}
