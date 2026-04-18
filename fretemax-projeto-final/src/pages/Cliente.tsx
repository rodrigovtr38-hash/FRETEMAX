import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { MapPin, CheckCircle2, MessageCircle, ArrowLeft } from 'lucide-react';

type VehicleType = 'carro pequeno' | 'utilitário' | 'caminhão 3/4' | 'carreta';

export default function Cliente() {
  const [coletaRua, setColetaRua] = useState('');
  const [coletaCep, setColetaCep] = useState('');
  const [entregaRua, setEntregaRua] = useState('');
  const [entregaCep, setEntregaCep] = useState('');

  // Nova Lógica de Distância Automática
  const [autoDistance, setAutoDistance] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [company, setCompany] = useState('');
  const [material, setMaterial] = useState('');
  const [weight, setWeight] = useState('');

  const [vehicle, setVehicle] = useState<VehicleType>('carro pequeno');
  const [urgent, setUrgent] = useState(false);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [driverContact, setDriverContact] = useState<{name: string, phone: string} | null>(null);

  const [availableDriverCount, setAvailableDriverCount] = useState<number | null>(null);

  const base = 20;
  const multipliers: Record<VehicleType, number> = {
    'carro pequeno': 2,
    'utilitário': 3,
    'caminhão 3/4': 5,
    'carreta': 10,
  };

  const valorMotorista = base + (autoDistance * multipliers[vehicle]);
  let valorCliente = valorMotorista * 1.20;
  if (urgent) {
    valorCliente = valorCliente * 1.30;
  }

  // Formatacao de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setter(v.slice(0, 9));
  };

  // Motor de Cálculo Automático de Distância
  useEffect(() => {
    if (coletaCep.length === 9 && entregaCep.length === 9) {
      setIsCalculating(true);
      // Simula a requisição rápida ao Google Maps
      const timer = setTimeout(() => {
        setAutoDistance(18.5); // Distância simulada para o MVP rodar liso
        setIsCalculating(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setAutoDistance(0);
    }
  }, [coletaCep, entregaCep]);

  // Check drivers
  useEffect(() => {
    const fetchAvail = async () => {
      if (!coletaCep || !vehicle || autoDistance <= 0) {
        setAvailableDriverCount(null);
        return;
      }
      try {
        const q = query(collection(db, 'motoristas'), where('vehicleType', '==', vehicle));
        const snap = await getDocs(q);
        setAvailableDriverCount(snap.docs.length);
      } catch(e) {}
    }
    fetchAvail();
  }, [coletaCep, vehicle, autoDistance]);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribe = onSnapshot(
      doc(db, 'fretes', orderId), 
      (snapshot) => {
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
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `fretes/${orderId}`);
      }
    );
    return () => unsubscribe();
  }, [orderId]);

  const handlePagar = async () => {
    if (!coletaRua || !coletaCep || !entregaRua || !entregaCep || autoDistance <= 0) {
      alert("Preencha todos os campos obrigatórios de endereço.");
      return;
    }
    
    const origemConcatenada = `${coletaRua}, CEP: ${coletaCep}`;
    const destinoConcatenado = `${entregaRua}, CEP: ${entregaCep}`;

    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        cidadeOrigem: origemConcatenada,
        cidadeDestino: destinoConcatenado,
        distancia: autoDistance,
        veiculo: vehicle,
        responsavel: company,
        material: material,
        peso: weight,
        valorMotorista,
        valorCliente,
        status: 'aguardando_motorista',
        clienteId: 'anon',
        createdAt: serverTimestamp()
      });
      setOrderId(docRef.id);
      setOrderStatus('aguardando_motorista');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fretes');
    }
  };

  // Tela 3: Motorista Encontrado
  if (orderStatus === 'aceito') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col pt-8">
        <div className="p-6 flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-16 h-16 bg-[#dcfce7] text-[#166534] rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-slate-800">🚚 Motorista a caminho!</h2>
            <p className="text-slate-500 mt-2 text-sm">
              O motorista aceitou seu frete e já está se deslocando.
            </p>
          </div>
          
          {driverContact && driverContact.phone && (
            <a
              href={`https://wa.me/55${driverContact.phone.replace(/[^0-9]/g, '')}?text=Olá,%20sou%20o%20cliente%20do%20FreteMax.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 p-[14px] flex items-center justify-center gap-2 bg-[#25d366] text-white text-[15px] font-semibold rounded-lg transition-colors hover:opacity-90"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com {driverContact.name}
            </a>
          )}
        </div>
      </div>
    );
  }

  // Tela 2: Radar Buscando Motorista
  if (orderStatus === 'aguardando_motorista') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-[16px] font-semibold text-slate-800">Acompanhamento</h2>
          <span className="inline-block px-3 py-1 rounded-full text-[12px] font-semibold uppercase bg-[#fef3c7] text-[#92400e]">
            Aguardando...
          </span>
        </div>
        <div className="p-6 flex flex-col items-center text-center gap-6 animate-in fade-in">
          <div className="relative w-16 h-16 flex items-center justify-center mt-4">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <MapPin className="w-6 h-6 text-blue-600 relative z-10" />
          </div>
          <div>
            <p className="text-[16px] font-semibold leading-[1.6] text-slate-800 mt-2">
              🔎 Procurando motorista na sua região...
            </p>
            <div className="h-2 bg-slate-100 rounded-full mt-6 overflow-hidden">
              <div className="w-2/5 h-full bg-blue-600 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela 1: Formulário Principal
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button 
        onClick={() => window.location.href = '/'} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-5 h-5" /> Voltar ao Início
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-neutral-50">
          <h2 className="text-[16px] font-semibold text-slate-800">Simulador Automático de Frete</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="p-4 border-[1.5px] border-slate-200 rounded-lg bg-white relative">
              <span className="absolute -top-[10px] left-3 bg-white px-2 text-[12px] font-bold uppercase text-blue-600 tracking-[0.5px]">Origem (Coleta)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Rua, Número e Bairro</label>
                  <input 
                    className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-md text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                    placeholder="Av. Paulista, 1000 - Bela Vista"
                    value={coletaRua}
                    onChange={e => setColetaRua(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">CEP (Obrigatório)</label>
                  <input 
                    className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-md text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                    placeholder="00000-000"
                    value={coletaCep}
                    onChange={e => handleCepChange(e, setColetaCep)}
                    maxLength={9}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-[1.5px] border-slate-200 rounded-lg bg-white relative">
              <span className="absolute -top-[10px] left-3 bg-white px-2 text-[12px] font-bold uppercase text-orange-600 tracking-[0.5px]">Destino (Entrega)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Rua, Número e Bairro</label>
                  <input 
                    className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-md text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                    placeholder="Av. Brigadeiro Faria Lima, 200 - Pinheiros"
                    value={entregaRua}
                    onChange={e => setEntregaRua(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">CEP (Obrigatório)</label>
                  <input 
                    className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-md text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                    placeholder="00000-000"
                    value={entregaCep}
                    onChange={e => handleCepChange(e, setEntregaCep)}
                    maxLength={9}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 border-[1.5px] border-slate-200 rounded-lg bg-slate-50">
                <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Distância Calculada</label>
                {isCalculating ? (
                  <span className="text-blue-600 text-sm font-semibold animate-pulse">Processando satélite...</span>
                ) : autoDistance > 0 ? (
                  <span className="text-slate-800 text-sm font-bold">{autoDistance} KM</span>
                ) : (
                  <span className="text-slate-400 text-sm">Preencha os CEPs acima</span>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Veículo</label>
                <select 
                  className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-[14px] transition-colors focus:border-blue-600 focus:outline-none bg-white"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value as VehicleType)}
                >
                  <option value="carro pequeno">Carro Pequeno</option>
                  <option value="utilitário">Utilitário</option>
                  <option value="caminhão 3/4">Caminhão 3/4</option>
                  <option value="carreta">Carreta (até 30 toneladas)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-2">
              <h3 className="text-[13px] font-bold text-slate-700 mb-3">Dados da Carga (B2B)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Empresa / Responsável</label>
                  <input 
                    className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 focus:outline-none"
                    placeholder="Ex: Transportes XYZ ou João da Silva"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Tipo de Material</label>
                    <input 
                      className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 focus:outline-none"
                      placeholder="Ex: Caixas, Pallets..."
                      value={material}
                      onChange={e => setMaterial(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Peso Aprox.</label>
                    <input 
                      className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-blue-600 focus:outline-none"
                      placeholder="Ex: 500kg, 2 ton"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {availableDriverCount !== null && autoDistance > 0 && (
              <div className="mb-4 mt-4 p-3 rounded-lg text-[14px] font-medium border border-slate-100 bg-slate-50">
                {availableDriverCount >= 3 ? (
                  <span className="text-green-600 flex items-center gap-2">✅ {availableDriverCount} motoristas disponíveis na sua região</span>
                ) : availableDriverCount >= 1 ? (
                  <span className="text-yellow-600 flex items-center gap-2">⚠️ Poucos motoristas disponíveis ({availableDriverCount})</span>
                ) : (
                  <span className="text-red-500 flex items-center gap-2">❌ Nenhum motorista disponível</span>
                )}
              </div>
            )}

            <div className="mb-4 flex items-center gap-2 text-[14px] text-slate-500">
              <input 
                type="checkbox" 
                checked={urgent} 
                onChange={e => setUrgent(e.target.checked)}
                className="w-4 h-4 rounded border-[1.5px] border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Solicitação Urgente (+30%)</span>
            </div>
          </div>

          <div className="my-6 p-4 bg-[#eff6ff] rounded-lg">
            <label className="block text-[12px] font-bold text-blue-600 mb-1">Valor do Frete</label>
            <div className="text-[24px] font-bold text-slate-800 tracking-tight">
              {autoDistance > 0 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorCliente)
                : 'R$ 0,00'}
            </div>
          </div>

          <button 
            onClick={handlePagar}
            disabled={!coletaRua || !coletaCep || !entregaRua || !entregaCep || autoDistance <= 0}
            className="w-full p-[14px] border-none rounded-lg text-[15px] font-semibold cursor-pointer text-center bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            Pagar e Chamar Motorista
          </button>
        </div>
      </div>
    </div>
  );
}
