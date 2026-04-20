import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Cliente() {
  const [coletaRua, setColetaRua] = useState('');
  const [coletaCep, setColetaCep] = useState('');
  const [entregaRua, setEntregaRua] = useState('');
  const [entregaCep, setEntregaCep] = useState('');

  const [autoDistance, setAutoDistance] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [company, setCompany] = useState('');
  const [material, setMaterial] = useState('');
  const [weight, setWeight] = useState('');

  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [urgent, setUrgent] = useState(false);

  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // MOTOR MATEMÁTICO BLINDADO
  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  const distanciaSegura = autoDistance || 0;
  const base = 20;
  
  const valorMotorista = base + (distanciaSegura * multiplicador);
  let valorCliente = valorMotorista * 1.20; 
  if (urgent) {
    valorCliente *= 1.30;
  }

  const valorFormatado = `R$ ${valorCliente.toFixed(2).replace('.', ',')}`;

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setter(v.slice(0, 9));
  };

  useEffect(() => {
    if (coletaCep.length === 9 && entregaCep.length === 9) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        setAutoDistance(18.5); 
        setIsCalculating(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setAutoDistance(0);
    }
  }, [coletaCep, entregaCep]);

  const handlePagar = async () => {
    if (!coletaRua || !coletaCep || !entregaRua || !entregaCep || autoDistance <= 0) {
      alert("Preencha todos os campos de endereço corretamente.");
      return;
    }
    
    setOrderStatus('aguardando_motorista');
    
    try {
      await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: `${coletaRua}, CEP: ${coletaCep}`,
        cidadeDestino: `${entregaRua}, CEP: ${entregaCep}`,
        distancia: distanciaSegura,
        veiculo: vehicle,
        responsavel: company,
        material: material,
        peso: weight,
        urgente: urgent,
        valorMotorista,
        valorCliente,
        status: 'aguardando_motorista',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      alert("Falha de conexão. Tente novamente.");
      setOrderStatus(null);
    }
  };

  if (orderStatus === 'aguardando_motorista') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-[16px] font-semibold text-slate-800">Status do Frete</h2>
          <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#fef3c7] text-[#92400e]">Buscando...</span>
        </div>
        <div className="p-8 flex flex-col items-center text-center gap-4">
          <MapPin className="w-10 h-10 text-blue-600 animate-bounce" />
          <p className="text-[16px] font-semibold text-slate-800">Procurando motoristas na região...</p>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div className="w-1/2 h-full bg-blue-600 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Início
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-neutral-50"><h2 className="text-[16px] font-semibold text-slate-800">Simulador Automático de Frete</h2></div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border-[1.5px] border-slate-200 rounded-lg relative">
              <span className="absolute -top-[10px] left-3 bg-white px-2 text-[11px] font-bold uppercase text-blue-600">Origem (Coleta)</span>
              <input className="w-full p-2 mb-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="Rua e Número" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
              <input className="w-full p-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="CEP" value={coletaCep} onChange={e => handleCepChange(e, setColetaCep)} maxLength={9} />
            </div>
            <div className="p-4 border-[1.5px] border-slate-200 rounded-lg relative">
              <span className="absolute -top-[10px] left-3 bg-white px-2 text-[11px] font-bold uppercase text-orange-600">Destino (Entrega)</span>
              <input className="w-full p-2 mb-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="Rua e Número" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
              <input className="w-full p-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="CEP" value={entregaCep} onChange={e => handleCepChange(e, setEntregaCep)} maxLength={9} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border-[1.5px] border-slate-200 rounded-lg bg-slate-50">
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Distância</label>
              {isCalculating ? <span className="text-blue-600 text-sm font-bold animate-pulse">Calculando...</span> : <span className="text-slate-800 text-sm font-bold">{distanciaSegura} KM</span>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Veículo</label>
              <select className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-blue-600" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option value="Carro Pequeno">Carro Pequeno</option>
                <option value="Utilitário (Fiorino, Kangoo)">Utilitário (Fiorino, Kangoo)</option>
                <option value="Caminhão 3/4">Caminhão 3/4</option>
                <option value="Carreta (Até 30t)">Carreta (Até 30t)</option>
              </select>
            </div>
          </div>

          <div className="bg-[#eff6ff] p-5 rounded-lg text-center mt-6">
            <p className="text-[12px] font-bold text-blue-600 uppercase">Valor do Frete</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{valorFormatado}</p>
          </div>

          <button onClick={handlePagar} disabled={distanciaSegura <= 0} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300">
            Pagar e Chamar Motorista
          </button>
        </div>
      </div>
    </div>
  );
}
