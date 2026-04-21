import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { MapPin, ArrowLeft, Package, XCircle, CheckCircle2, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export default function Cliente() {
  const [coletaCep, setColetaCep] = useState('');
  const [entregaCep, setEntregaCep] = useState('');
  const [vehicle, setVehicle] = useState('Carro Pequeno');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [autoDistance, setAutoDistance] = useState(0);

  useEffect(() => {
    if (currentOrderId) {
      const unsub = onSnapshot(collection(db, 'fretes'), (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === currentOrderId);
        if (doc) setOrderData(doc.data());
      });
      return () => unsub();
    }
  }, [currentOrderId]);

  useEffect(() => {
    const c1 = coletaCep.replace(/\D/g, '');
    const c2 = entregaCep.replace(/\D/g, '');
    if (c1.length === 8 && c2.length === 8) {
      setAutoDistance(Math.floor(Math.random() * 20) + 12);
    } else { setAutoDistance(0); }
  }, [coletaCep, entregaCep]);

  const valorFinal = (20 + (autoDistance * 3)) * 1.20;
  const valorFormatado = autoDistance > 0 ? `R$ ${valorFinal.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  const handleContratar = async () => {
    if (autoDistance <= 0) return;
    try {
      const docRef = await addDoc(collection(db, 'fretes'), {
        distancia: autoDistance, veiculo: vehicle,
        valorFinal: valorFormatado, status: 'aguardando_pagamento', // TRAVA DE PAGAMENTO
        createdAt: serverTimestamp()
      });
      setCurrentOrderId(docRef.id);
    } catch (e) { alert("Erro ao processar."); }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-900 p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black text-white text-2xl italic tracking-tighter uppercase">FRETOGO</span>
        </div>
        <ShieldCheck className="text-green-400 w-5 h-5" />
      </nav>

      <div className="max-w-md mx-auto px-4 mt-6">
        {currentOrderId ? (
          <div className="bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 p-8 text-center animate-in zoom-in">
            {orderData?.status === 'motorista_a_caminho' ? (
              <div className="animate-in slide-in-from-bottom">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">Motorista Confirmado!</h2>
                <div className="mt-6 p-6 bg-white rounded-3xl shadow-lg border-b-4 border-green-500">
                   <p className="text-slate-400 text-[10px] font-bold uppercase">Motorista</p>
                   <p className="text-xl font-black text-slate-900 mb-4">{orderData.motoristaNome}</p>
                   <button onClick={() => window.open(`https://wa.me/55${orderData.motoristaZap}?text=Oi, vi seu frete no FRETOGO!`)} className="w-full bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                     <Smartphone /> FALAR AGORA
                   </button>
                </div>
              </div>
            ) : (
              <div className="py-10">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Package className="text-white w-10 h-10" />
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase italic">Aguardando Pagamento...</h2>
                <p className="text-slate-500 text-sm mt-2 px-4 italic font-medium">"14 motoristas ativos agora. Pague para liberar sua coleta imediata."</p>
                <div className="mt-8 bg-yellow-400 p-4 rounded-2xl font-black text-slate-900">PAGAR COM PIX (SIMULADO)</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-1">Status da Região</p>
              <p className="font-bold text-sm leading-tight italic">Alta demanda de fretes em São Paulo. Garanta seu motorista agora.</p>
            </div>
            
            <div className="space-y-3">
              <input className="w-full p-5 bg-slate-100 rounded-2xl font-bold border-none" placeholder="CEP de Coleta" value={coletaCep} onChange={e => setColetaCep(e.target.value)} />
              <input className="w-full p-5 bg-slate-100 rounded-2xl font-bold border-none" placeholder="CEP de Entrega" value={entregaCep} onChange={e => setEntregaCep(e.target.value)} />
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] text-center shadow-2xl border-b-8 border-blue-600">
               <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Valor Garantido FRETOGO</p>
               <p className="text-5xl font-black text-white italic">{valorFormatado}</p>
            </div>

            <button onClick={handleContratar} disabled={autoDistance <= 0} className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl text-xl shadow-2xl active:scale-95 transition-all">
              RESERVAR MOTORISTA AGORA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
