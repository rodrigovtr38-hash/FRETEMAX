import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ArrowLeft, Download, Car, Package, XCircle } from 'lucide-react';

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
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [autoDistance, setAutoDistance] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const formatarCEP = (valor: string) => {
    if (!valor) return '';
    let v = valor.replace(/\D/g, ''); 
    if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8);
    return v.substring(0, 9);
  };

  const checarDistancia = (cepOrigem: string, cepDestino: string) => {
    try {
      if (!cepOrigem || !cepDestino) { setAutoDistance(0); return; }
      const c1 = cepOrigem.replace(/\D/g, '');
      const c2 = cepDestino.replace(/\D/g, '');
      if (c1.length !== 8 || c2.length !== 8) { setAutoDistance(0); return; }
      setIsCalculating(true);
      setTimeout(() => {
        setAutoDistance(Math.floor(Math.random() * 30) + 5);
        setIsCalculating(false);
      }, 800);
    } catch (e) { setAutoDistance(0); setIsCalculating(false); }
  };

  const handleColetaChange = (e: any) => {
    const v = formatarCEP(e.target.value);
    setColetaCep(v);
    if (v.length === 9 && entregaCep.length === 9) checarDistancia(v, entregaCep);
  };

  const handleEntregaChange = (e: any) => {
    const v = formatarCEP(e.target.value);
    setEntregaCep(v);
    if (v.length === 9 && coletaCep.length === 9) checarDistancia(coletaCep, v);
  };

  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  let valorFinal = 20 + (autoDistance * multiplicador);
  valorFinal = valorFinal * 1.20; 
  if (urgent) valorFinal = valorFinal * 1.30;

  const valorFormatado = (autoDistance > 0 && Number.isFinite(valorFinal))
    ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handlePagar = async () => {
    if (!coletaRua || !coletaCep || !entregaRua || !entregaCep || autoDistance <= 0) {
      alert("Preencha todos os campos corretamente."); return;
    }
    setOrderStatus('aguardando_motorista');
    try {
      await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: `${coletaRua}, CEP: ${coletaCep}`,
        cidadeDestino: `${entregaRua}, CEP: ${entregaCep}`,
        distancia: autoDistance,
        veiculo: vehicle,
        responsavel: company,
        material: material,
        peso: weight,
        urgente: urgent,
        valorFinal: valorFormatado,
        status: 'aguardando_motorista',
        createdAt: serverTimestamp()
      });
    } catch (error) { setOrderStatus(null); }
  };

  // TELA DE BUSCA COM BOTÃO VOLTAR
  if (orderStatus === 'aguardando_motorista') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
        <MapPin className="w-12 h-12 text-blue-600 animate-bounce mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Buscando motoristas...</h2>
        <p className="text-slate-500 mt-2">Seu pedido foi enviado para os parceiros na região.</p>
        <div className="w-full h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
          <div className="w-1/2 h-full bg-blue-600 animate-pulse"></div>
        </div>
        <button onClick={() => setOrderStatus(null)} className="mt-8 flex items-center justify-center gap-2 w-full p-3 text-red-500 font-bold border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
          <XCircle className="w-5 h-5" /> Cancelar Pedido e Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold">
            <ArrowLeft className="w-5 h-5" /> FreteMax
          </button>
          <button onClick={() => window.location.href = '/motorista'} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">Sou Motorista</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 border-b pb-4">
             <Package className="w-5 h-5 text-blue-600" />
             <h2 className="font-bold text-slate-800">Simulador de Frete</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Origem</label>
              <input className="w-full p-3 border rounded-lg text-sm" placeholder="Rua e Número" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-lg text-sm" placeholder="CEP" value={coletaCep} onChange={handleColetaChange} maxLength={9} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Destino</label>
              <input className="w-full p-3 border rounded-lg text-sm" placeholder="Rua e Número" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
              <input className="w-full p-3 border rounded-lg text-sm" placeholder="CEP" value={entregaCep} onChange={handleEntregaChange} maxLength={9} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Distância</p>
              <p className="font-bold text-slate-700">{isCalculating ? 'Calculando...' : `${autoDistance} KM`}</p>
            </div>
            <div className="space-y-1">
               <label className="text-[11px] font-bold text-slate-400 uppercase">Veículo</label>
               <select className="w-full p-3 border rounded-lg text-sm bg-white" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  <option>Carro Pequeno</option>
                  <option>Utilitário</option>
                  <option>Caminhão 3/4</option>
                  <option>Carreta</option>
               </select>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3 text-left">
             <label className="text-[11px] font-bold text-slate-400 uppercase">Informações do Envio</label>
             <input className="w-full p-3 border rounded-lg text-sm" placeholder="Seu Nome ou Empresa" value={company} onChange={e => setCompany(e.target.value)} />
             <div className="grid grid-cols-2 gap-3">
                <input className="w-full p-3 border rounded-lg text-sm" placeholder="O que vai levar?" value={material} onChange={e => setMaterial(e.target.value)} />
                <input className="w-full p-3 border rounded-lg text-sm" placeholder="Peso Aprox." value={weight} onChange={e => setWeight(e.target.value)} />
             </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-orange-800">Solicitação Urgente (+30%)</span>
          </div>

          <div className="bg-blue-600 p-6 rounded-xl text-center text-white">
             <p className="text-xs font-bold uppercase opacity-80">Valor Estimado</p>
             <p className="text-4xl font-black">{valorFormatado}</p>
          </div>

          <button onClick={handlePagar} disabled={autoDistance <= 0} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black disabled:bg-slate-300 transition-all">
            Chamar Motorista Agora
          </button>
        </div>
      </div>
    </div>
  );
}
