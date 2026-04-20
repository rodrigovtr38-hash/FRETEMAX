import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { MapPin, ArrowLeft, Download, Car, Package, XCircle, CheckCircle2 } from 'lucide-react';

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

  // ESCUTA O STATUS DO PEDIDO EM TEMPO REAL
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
      setTimeout(() => { setAutoDistance(Math.floor(Math.random() * 30) + 5); setIsCalculating(false); }, 800);
    }
  };

  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  let valorFinal = (20 + (autoDistance * multiplicador)) * 1.20; 
  if (urgent) valorFinal *= 1.30;
  const valorFormatado = autoDistance > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handlePagar = async () => {
    if (!coletaCep || !entregaCep || autoDistance <= 0) { alert("Preencha os dados corretamente."); return; }
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: coletaRua || coletaCep,
        cidadeDestino: entregaRua || entregaCep,
        distancia: autoDistance,
        veiculo: vehicle,
        responsavel: company || 'Cliente Particular',
        material: material || 'Carga Geral',
        peso: weight || 'Não informado',
        urgente: urgent,
        valorFinal: valorFormatado,
        status: 'aguardando_motorista', // SINAL PARA O RADAR
        createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
    } catch (error) { alert("Erro ao chamar motorista."); }
  };

  // TELA DE MATCH (O que o cliente vê enquanto espera ou após aceite)
  if (currentOrderId) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 text-center animate-in fade-in zoom-in">
        {orderData?.status === 'motorista_a_caminho' ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Motorista a Caminho!</h2>
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 uppercase font-bold">Motorista</p>
              <p className="text-lg font-black text-blue-600">{orderData.motoristaNome}</p>
              <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap.replace(/\D/g,'')}`)} className="mt-4 w-full bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                Falar no WhatsApp
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
            <p className="text-slate-500 mt-2 text-sm">Notificando parceiros de {vehicle} na região.</p>
            <button onClick={() => setCurrentOrderId(null)} className="mt-10 text-red-500 text-sm font-bold flex items-center justify-center gap-2 w-full">
              <XCircle className="w-4 h-4" /> Cancelar Pedido
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <nav className="bg-white border-b p-4 flex justify-between items-center max-w-2xl mx-auto rounded-b-xl">
        <button onClick={() => window.location.href = '/'} className="font-black text-blue-600">FRETEMAX</button>
        <button onClick={() => window.location.href = '/motorista'} className="text-xs bg-slate-100 px-3 py-1.5 rounded-full font-bold">Painel Motorista</button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          <h2 className="font-bold flex items-center gap-2"><Package className="text-blue-600 w-5 h-5"/> Novo Frete</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Origem</label>
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="Rua e Número" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="CEP" value={coletaCep} onChange={e => handleCepChange(e.target.value, setColetaCep)} maxLength={9} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Destino</label>
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="Rua e Número" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-xl text-sm" placeholder="CEP" value={entregaCep} onChange={e => handleCepChange(e.target.value, setEntregaCep)} maxLength={9} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase">KM Estimado</p>
              <p className="font-black text-slate-700">{isCalculating ? '...' : `${autoDistance} KM`}</p>
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

          <div className="border-t pt-4 space-y-3 text-left">
             <input className="w-full p-3 border rounded-xl text-sm" placeholder="Nome da Empresa" value={company} onChange={e => setCompany(e.target.value)} />
             <div className="grid grid-cols-2 gap-3">
                <input className="w-full p-3 border rounded-xl text-sm" placeholder="O que é a carga?" value={material} onChange={e => setMaterial(e.target.value)} />
                <input className="w-full p-3 border rounded-xl text-sm" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)} />
             </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl text-center text-white shadow-lg shadow-blue-100">
             <p className="text-[10px] font-bold uppercase opacity-70">Valor Total</p>
             <p className="text-4xl font-black">{valorFormatado}</p>
          </div>

          <button onClick={handlePagar} disabled={autoDistance <= 0} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black active:scale-95 transition-all">
            CHAMAR MOTORISTA AGORA
          </button>
        </div>
      </div>
    </div>
  );
}
