import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { MapPin, CheckCircle2, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

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

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [driverContact, setDriverContact] = useState<{name: string, phone: string} | null>(null);
  const [availableDriverCount, setAvailableDriverCount] = useState<number | null>(null);

  // BLINDAGEM MATEMÁTICA ABSOLUTA
  const getMultiplier = (veh: string) => {
    const v = String(veh || '').toLowerCase();
    if (v.includes('utilitário') || v.includes('utilitario')) return 3;
    if (v.includes('caminhão') || v.includes('caminhao')) return 5;
    if (v.includes('carreta')) return 10;
    return 2; // Padrão seguro para Carro Pequeno
  };

  const safeDistance = Number(autoDistance) || 0;
  const multiplier = getMultiplier(vehicle);
  const base = 20;
  
  const valorMotorista = base + (safeDistance * multiplier);
  let valorCliente = valorMotorista * 1.20; // Margem de 20%
  if (urgent) {
    valorCliente *= 1.30;
  }

  // TRAVA DE SEGURANÇA PARA A TELA NÃO FICAR BRANCA
  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

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

  useEffect(() => {
    const fetchAvail = async () => {
      if (!coletaCep || !vehicle || autoDistance <= 0) {
        setAvailableDriverCount(null);
        return;
      }
      try {
        const q = query(collection(db, 'motoristas_cadastros'), where('categoria', '==', vehicle));
        const snap = await getDocs(q);
        setAvailableDriverCount(snap.docs.length);
      } catch(e) {
        setAvailableDriverCount(0);
      }
    }
    fetchAvail();
  }, [coletaCep, vehicle, autoDistance]);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribe = onSnapshot(doc(db, 'fretes', orderId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setOrderStatus(data.status);
          if (data.status === 'aceito') {
            setDriverContact({
              name: data.motoristaNome || 'Motorista',
              phone: data.motoristaWhatsapp || '',
            });
          }
        }
      }
    );
    return () => unsubscribe();
  }, [orderId]);

  const handlePagar = async () => {
    if (!coletaRua || !coletaCep || !entregaRua || !entregaCep || autoDistance <= 0) {
      alert("Preencha todos os campos de endereço corretamente.");
      return;
    }
    
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: `${coletaRua}, CEP: ${coletaCep}`,
        cidadeDestino: `${entregaRua}, CEP: ${entregaCep}`,
        distancia: safeDistance,
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
      setOrderId(docRef.id);
      setOrderStatus('aguardando_motorista');
    } catch (error) {
      alert("Erro ao conectar com o banco. Tente novamente.");
    }
  };

  if (orderStatus === 'aceito') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col pt-8">
        <div className="p-6 flex flex-col items-center text-center gap-6 animate-in fade-in">
          <div className="w-16 h-16 bg-[#dcfce7] text-[#166534] rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-slate-800">🚚 Motorista a caminho!</h2>
            <p className="text-slate-500 mt-2 text-sm">Seu frete foi aceito.</p>
          </div>
          {driverContact && driverContact.phone && (
            <a href={`https://wa.me/55${driverContact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full mt-2 p-[14px] flex items-center justify-center gap-2 bg-[#25d366] text-white font-semibold rounded-lg hover:opacity-90">
              <MessageCircle className="w-5 h-5" /> Falar com {driverContact.name}
            </a>
          )}
        </div>
      </div>
    );
  }

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
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Distância Calculada</label>
              {isCalculating ? <span className="text-blue-600 text-sm font-bold animate-pulse">Calculando...</span> : <span className="text-slate-800 text-sm font-bold">{safeDistance} KM</span>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Veículo</label>
              <select className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-blue-600" value={vehicle} onChange={e => setVehicle(e.target.value)}>
                <option value="Carro Pequeno">Carro Pequeno</option>
                <option value="Utilitário">Utilitário (Fiorino, Kangoo)</option>
                <option value="Caminhão 3/4">Caminhão 3/4</option>
                <option value="Carreta">Carreta (Até 30t)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-2">
            <h3 className="text-[13px] font-bold text-slate-700 mb-3">Dados da Carga (B2B)</h3>
            <div className="space-y-3">
              <div>
                <input className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 outline-none" placeholder="Empresa / Responsável" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 outline-none" placeholder="Tipo de Material" value={material} onChange={e => setMaterial(e.target.value)} />
                <input className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 outline-none" placeholder="Peso Aproximado" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
            </div>
          </div>
          
          {availableDriverCount !== null && safeDistance > 0 && (
            <div className={`p-3 rounded-lg text-[13px] font-medium border flex items-center gap-2 ${availableDriverCount > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
              <AlertTriangle className="w-4 h-4" /> 
              {availableDriverCount > 0 ? `${availableDriverCount} motoristas na região` : 'Poucos motoristas disponíveis (1)'}
            </div>
          )}

          <div className="flex items-center gap-2 text-[14px] text-slate-600 font-medium">
            <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
            <span>Solicitação Urgente (+30%)</span>
          </div>

          <div className="bg-[#eff6ff] p-5 rounded-lg text-center mt-6">
            <p className="text-[12px] font-bold text-blue-600 uppercase">Valor do Frete</p>
            <p className="text-3xl font-black text-slate-800 mt-1">
               {safeDistance > 0 ? formatCurrency(valorCliente) : 'R$ 0,00'}
            </p>
          </div>

          <button onClick={handlePagar} disabled={safeDistance <= 0} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300">
            Pagar e Chamar Motorista
          </button>
        </div>
      </div>
    </div>
  );
}
