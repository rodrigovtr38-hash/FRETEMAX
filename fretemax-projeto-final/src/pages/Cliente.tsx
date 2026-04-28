import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc } from 'firebase/firestore';
import { ArrowLeft, Zap, Truck, Package, Loader2, CheckCircle } from 'lucide-react';
import MapaCliente from '../components/MapaCliente';

export default function Cliente() {

  const [step, setStep] = useState('form');
  const [loadingPay, setLoadingPay] = useState(false);

  const [coleta, setColeta] = useState({ cep: '', bairro: '', rua: '', num: '' });
  const [entrega, setEntrega] = useState({ cep: '', bairro: '', rua: '', num: '' });

  const [vehicle, setVehicle] = useState('carro_pequeno');

  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  const configuracao: any = {
    'carro_pequeno': { nome: 'Carro Pequeno', fator: 1.0, pisoANTT: 0 },
    'utilitario': { nome: 'Utilitário / Fiorino', fator: 1.6, pisoANTT: 0 },
    'toco': { nome: 'Caminhão Toco', fator: 2.9, pisoANTT: 3.12 },
    'truck': { nome: 'Caminhão Truck', fator: 3.8, pisoANTT: 3.89 },
    'carreta_ls': { nome: 'Carreta LS', fator: 5.5, pisoANTT: 5.08 },
    'bi_trem_cegonha': { nome: 'Bi-trem', fator: 7.2, pisoANTT: 6.11 }
  };

  const dist = (coleta.cep.length >= 8 && entrega.cep.length >= 8) ? 25 : 0;

  const calcularValorFinal = () => {
    const hora = new Date().getHours();
    const mult = (hora >= 17 && hora <= 20) ? 1.15 : 1.0;

    const valorBase = (32 + (dist * 3.80)) * configuracao[vehicle].fator;
    const precoDinamico = valorBase * mult;

    const pisoMinimo = dist * configuracao[vehicle].pisoANTT;

    return Math.max(precoDinamico, pisoMinimo);
  };

  const valorTotalBruto = calcularValorFinal();

  // ✅ CORREÇÃO DO LOOP
  useEffect(() => {
    const savedOrderId = localStorage.getItem('fretogo_current_order');

    if (savedOrderId && savedOrderId !== 'null') {
      setCurrentOrderId(savedOrderId);
      setStep('busca');
    }
  }, []);

  useEffect(() => {
    if (!currentOrderId) return;

    const unsub = onSnapshot(doc(db, 'fretes', currentOrderId), (docSnap) => {
      if (docSnap.exists()) setOrderData(docSnap.data());
    });

    return () => unsub();
  }, [currentOrderId]);

  const obterCoordenadas = async (cep: string) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${cep}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`);
      const data = await res.json();
      return data.status === 'OK' ? data.results[0].geometry.location : null;
    } catch {
      return null;
    }
  };

  const handleContratar = async () => {
    setLoadingPay(true);

    try {
      const coords = await obterCoordenadas(coleta.cep);

      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: dist,
        veiculo: vehicle,
        valorTotal: Number(valorTotalBruto.toFixed(2)),
        valorMotorista: Number((valorTotalBruto * 0.80).toFixed(2)),
        cidadeOrigem: coleta.bairro,
        origemLat: coords?.lat || 0,
        origemLng: coords?.lng || 0,

        // ✅ CORREÇÃO IMPORTANTE
        status: 'aguardando_pagamento',

        createdAt: serverTimestamp()
      });

      setCurrentOrderId(docRef.id);
      localStorage.setItem('fretogo_current_order', docRef.id);

      const res = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Frete FRETOGO - ${configuracao[vehicle].nome}`,
          preco: valorTotalBruto.toFixed(2),
          idPedido: docRef.id
        })
      });

      const data = await res.json();

      if (data.url) window.location.href = data.url;

    } catch {
      alert("Erro no pagamento.");
      setLoadingPay(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">

      <nav className="bg-slate-950 p-4 flex items-center text-white">
        {step !== 'form' && (
          <ArrowLeft
            onClick={() => {
              localStorage.removeItem('fretogo_current_order');
              setCurrentOrderId(null);
              setOrderData(null);
              setStep('form');
            }}
            className="cursor-pointer"
          />
        )}
        <Zap className="ml-2 text-yellow-400" />
        <span className="ml-2 font-bold">FRETOGO</span>
      </nav>

      <div className="max-w-md mx-auto px-4 mt-4">

        {step === 'form' && (
          <div className="space-y-4">

            <button onClick={() => window.location.href = '/'}>
              Início
            </button>

            <input placeholder="CEP Coleta" onChange={e => setColeta({ ...coleta, cep: e.target.value })} />
            <input placeholder="CEP Entrega" onChange={e => setEntrega({ ...entrega, cep: e.target.value })} />

            <select value={vehicle} onChange={e => setVehicle(e.target.value)}>
              {Object.keys(configuracao).map(key => (
                <option key={key} value={key}>
                  {configuracao[key].nome}
                </option>
              ))}
            </select>

            <button onClick={() => setStep('preview')} disabled={dist <= 0}>
              VER PREÇO
            </button>

          </div>
        )}

        {step === 'preview' && (
          <div>

            <MapaCliente />

            <h2>R$ {valorTotalBruto.toFixed(2)}</h2>

            <button onClick={handleContratar}>
              {loadingPay ? <Loader2 /> : "CONTRATAR"}
            </button>

          </div>
        )}

        {step === 'busca' && (
          <div>

            {orderData?.status === 'aceito' ? (
              <div>
                <Truck />
                <p>Motorista: {orderData.motoristaNome}</p>
              </div>
            ) : (
              <div>
                <MapaCliente />
                <Package />
                <p>Aguardando pagamento...</p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
