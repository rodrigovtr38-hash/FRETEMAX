import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { MapPin, ArrowLeft, Package, XCircle, CheckCircle2, Smartphone } from 'lucide-react';

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

  // CÁLCULO INSTANTÂNEO (Sem useEffect para não dar erro)
  const c1 = coletaCep.replace(/\D/g, '');
  const c2 = entregaCep.replace(/\D/g, '');
  const distanciaFicticia = (c1.length === 8 && c2.length === 8) ? 15 : 0;

  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  const valorBase = (20 + (distanciaFicticia * multiplicador)) * 1.20;
  const valorFinal = urgent ? valorBase * 1.30 : valorBase;
  const valorFormatado = distanciaFicticia > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handlePagar = async () => {
    if (distanciaFicticia <= 0) return;
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: coletaRua || coletaCep, cidadeDestino: entregaRua || entregaCep,
        distancia: distanciaFicticia, veiculo: vehicle, responsavel: company || 'Particular',
        material: material || 'Geral', peso: weight || 'N/A', urgente: urgent,
        valorFinal: valorFormatado, status: 'aguardando_motorista', createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
    } catch (e) { alert("Erro ao enviar."); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b p-4 flex items-center gap-4 max-w-2xl mx-auto">
        <button onClick={() => currentOrderId ? setCurrentOrderId(null) : window.location.href = '/'} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <span className="font-black text-blue-600">FRETEMAX</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6 pb-10">
        {currentOrderId ? (
          <div className="bg-white rounded-3xl border shadow-2xl p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
              <MapPin className="relative w-20 h-20 text-blue-600 mx-auto" />
            </div>
            <h2 className="text-xl font-bold">Procurando motoristas...</h2>
            <p className="text-slate-400 mt-2">Seu pedido de {vehicle} foi enviado ao radar.</p>
            <button onClick={() => setCurrentOrderId(null)} className="mt-10 text-red-500 font-bold w-full">Cancelar</button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-6">
            <h2 className="font-bold flex items-center gap-2"><Package className="text-blue-600"/> Solicitar Frete</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="space-y-4">
                <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Rua Coleta" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
                <input className="w-full p-4 border rounded-2xl text-sm font-bold bg-slate-50" placeholder="CEP Coleta" value={coletaCep} onChange={e => setColetaCep(e.target.value)} maxLength={9} />
              </div>
              <div className="space-y-4">
                <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Rua Entrega" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
                <input className="w-full p-4 border rounded-2xl text-sm font-bold bg-slate-50" placeholder="CEP Entrega" value={entregaCep} onChange={e => setEntregaCep(e.target.value)} maxLength={9} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <p className="text-[10px] font-bold opacity-50 uppercase">Distância</p>
                <p className="text-xl font-black">{distanciaFicticia} KM</p>
              </div>
              <select className="w-full p-4 border rounded-2xl text-sm bg-white font-black" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option>Carro Pequeno</option><option>Utilitário</option><option>Caminhão 3/4</option><option>Carreta</option>
              </select>
            </div>
            <div className="border-t pt-6 space-y-4">
               <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Nome/Empresa" value={company} onChange={e => setCompany(e.target.value)} />
               <div className="grid grid-cols-2 gap-4">
                  <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Carga" value={material} onChange={e => setMaterial(e.target.value)} />
                  <input className="w-full p-4 border rounded-2xl text-sm" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} />
               </div>
            </div>
            <div className="bg-blue-600 p-8 rounded-3xl text-center text-white shadow-2xl">
               <p className="text-xs font-bold uppercase opacity-70">Valor Estimado</p>
               <p className="text-5xl font-black">{valorFormatado}</p>
            </div>
            <button onClick={handlePagar} disabled={distanciaFicticia <= 0} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl hover:bg-black active:scale-95 transition-all text-xl shadow-xl disabled:bg-slate-200">
              CHAMAR MOTORISTA AGORA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
