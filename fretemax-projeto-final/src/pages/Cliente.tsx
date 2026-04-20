import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, ArrowLeft, Download, Car, Package } from 'lucide-react';

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

  // CÁLCULO SEGURO E AGORA DINÂMICO (Simulando variação de KM)
  const checarDistancia = (cepOrigem: string, cepDestino: string) => {
    try {
      if (!cepOrigem || !cepDestino) {
        setAutoDistance(0); return;
      }
      const c1 = cepOrigem.replace(/\D/g, '');
      const c2 = cepDestino.replace(/\D/g, '');
      
      if (c1.length !== 8 || c2.length !== 8) {
        setAutoDistance(0); return;
      }

      setIsCalculating(true);
      setTimeout(() => {
        try {
          // Gerador de KM falso baseado no CEP para simular realidade no teste
          const randomKm = Math.floor(Math.random() * (45 - 8 + 1)) + 8;
          setAutoDistance(randomKm);
        } catch (e) {
          setAutoDistance(0);
        } finally {
          setIsCalculating(false);
        }
      }, 800);
    } catch (error) {
      setAutoDistance(0);
      setIsCalculating(false);
    }
  };

  const handleColetaChange = (e: any) => {
    const valor = e.target.value || '';
    const formatado = formatarCEP(valor);
    setColetaCep(formatado);

    const cep1 = formatado.replace(/\D/g, '');
    const cep2 = entregaCep.replace(/\D/g, '');
    if (cep1.length === 8 && cep2.length === 8) {
      checarDistancia(cep1, cep2);
    } else {
      setAutoDistance(0);
    }
  };

  const handleEntregaChange = (e: any) => {
    const valor = e.target.value || '';
    const formatado = formatarCEP(valor);
    setEntregaCep(formatado);

    const cep1 = coletaCep.replace(/\D/g, '');
    const cep2 = formatado.replace(/\D/g, '');
    if (cep1.length === 8 && cep2.length === 8) {
      checarDistancia(cep1, cep2);
    } else {
      setAutoDistance(0);
    }
  };

  let multiplicador = 2;
  if (vehicle.includes('Utilitário')) multiplicador = 3;
  if (vehicle.includes('Caminhão')) multiplicador = 5;
  if (vehicle.includes('Carreta')) multiplicador = 10;

  let valorFinal = 20 + (autoDistance * multiplicador);
  valorFinal = valorFinal * 1.20; 
  if (urgent) valorFinal = valorFinal * 1.30;

  const valorSeguro = Number.isFinite(valorFinal) ? valorFinal : 0;
  const valorFormatado = autoDistance > 0 
    ? `R$ ${valorSeguro.toFixed(2).replace('.', ',')}` 
    : 'R$ 0,00';

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
    } catch (error) {
      alert("Falha de conexão com o banco de dados. Tente novamente.");
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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition-colors">
            <ArrowLeft className="w-5 h-5" /> FreteMax
          </button>
          
          <div className="flex gap-4 items-center">
            <button onClick={() => window.location.href = '/motorista'} className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
               <Car className="w-4 h-4" /> Sou Motorista
            </button>
            <button onClick={() => alert('Deseja instalar o app?')} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors border border-blue-200">
               <Download className="w-4 h-4" /> Instalar App
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-neutral-50 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-[16px] font-semibold text-slate-800">Simulador Automático de Frete</h2>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-[1.5px] border-slate-200 rounded-lg relative">
                <span className="absolute -top-[10px] left-3 bg-white px-2 text-[11px] font-bold uppercase text-blue-600">Origem (Coleta)</span>
                <input className="w-full p-2 mb-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="Rua e Número" value={coletaRua} onChange={e => setColetaRua(e.target.value)} />
                <input className="w-full p-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="CEP (Apenas Números)" value={coletaCep} onChange={handleColetaChange} maxLength={9} />
              </div>
              <div className="p-4 border-[1.5px] border-slate-200 rounded-lg relative">
                <span className="absolute -top-[10px] left-3 bg-white px-2 text-[11px] font-bold uppercase text-orange-600">Destino (Entrega)</span>
                <input className="w-full p-2 mb-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="Rua e Número" value={entregaRua} onChange={e => setEntregaRua(e.target.value)} />
                <input className="w-full p-2 border-[1.5px] rounded text-sm focus:border-blue-600 outline-none" placeholder="CEP (Apenas Números)" value={entregaCep} onChange={handleEntregaChange} maxLength={9} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border-[1.5px] border-slate-200 rounded-lg bg-slate-50">
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Distância Calculada</label>
                {isCalculating ? <span className="text-blue-600 text-sm font-bold animate-pulse">Calculando...</span> : <span className="text-slate-800 text-sm font-bold">{autoDistance > 0 ? `${autoDistance} KM` : '0 KM'}</span>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Veículo Necessário</label>
                <select className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-blue-600" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                  <option value="Carro Pequeno">Carro Pequeno</option>
                  <option value="Utilitário">Utilitário (Fiorino, Kangoo)</option>
                  <option value="Caminhão">Caminhão 3/4</option>
                  <option value="Carreta">Carreta (Até 30t)</option>
                </select>
              </div>
            </div>

            {/* SEÇÃO ATUALIZADA: SEM JARGÃO B2B */}
            <div className="border-t border-slate-200 pt-4 mt-2">
              <h3 className="text-[13px] font-bold text-slate-700 mb-3">Informações do Envio</h3>
              <div className="space-y-3">
                <div>
                  <input className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 outline-none" placeholder="Nome da Empresa ou Seu Nome" value={company} onChange={e => setCompany(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 outline-none" placeholder="O que vai levar? (Ex: Caixas)" value={material} onChange={e => setMaterial(e.target.value)} />
                  <input className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 outline-none" placeholder="Peso Aprox. (Ex: 50kg)" value={weight} onChange={e => setWeight(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[14px] text-slate-600 font-medium">
              <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              <span>Solicitação Urgente (+30%)</span>
            </div>

            <div className="bg-[#eff6ff] p-5 rounded-lg text-center mt-6">
              <p className="text-[12px] font-bold text-blue-600 uppercase">Valor do Frete</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{valorFormatado}</p>
            </div>

            <button onClick={handlePagar} disabled={autoDistance <= 0} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300">
              Pagar e Chamar Motorista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
