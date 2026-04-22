import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Zap, DollarSign, Users, Truck, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function Admin() {
  const [fretes, setFretes] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBruto: 0, lucroPlataforma: 0, pendenteRepasse: 0 });

  useEffect(() => {
    const q = query(collection(db, 'fretes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFretes(docs);

      // CÁLCULO DOS GRÁFICOS EM TEMPO REAL
      let bruto = 0;
      let lucro = 0;
      let pendente = 0;

      docs.forEach((f: any) => {
        if (f.status !== 'pendente' && f.status !== 'cancelado') {
          bruto += f.valorNumerico || 0;
          lucro += f.lucroPlataforma || 0;
          if (f.status === 'entregue_aguardando_repasse') {
            pendente += (f.valorNumerico * 0.8) || 0;
          }
        }
      });
      setStats({ totalBruto: bruto, lucroPlataforma: lucro, pendenteRepasse: pendente });
    });
    return () => unsub();
  }, []);

  const confirmarPagamento = async (id: string) => {
    if (!window.confirm("Confirmar que você já fez o Pix para este motorista?")) return;
    await updateDoc(doc(db, 'fretes', id), { status: 'finalizado_pago' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <nav className="bg-slate-950 p-6 text-white flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400 fill-yellow-400" />
          <h1 className="font-black italic text-2xl uppercase tracking-tighter">FRETOGO ADMIN</h1>
        </div>
        <div className="bg-blue-600 px-4 py-1 rounded-full text-[10px] font-black animate-pulse">LIVE DASHBOARD</div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* CARDS DE RESUMO COM CORES DE DESTAQUE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-green-500">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-green-100 p-3 rounded-2xl"><TrendingUp className="text-green-600" /></div>
              <p className="text-slate-400 font-bold uppercase text-xs">Seu Lucro (20%)</p>
            </div>
            <p className="text-4xl font-black text-slate-900 italic">R$ {stats.lucroPlataforma.toFixed(2)}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-yellow-500">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-yellow-100 p-3 rounded-2xl"><AlertCircle className="text-yellow-600" /></div>
              <p className="text-slate-400 font-bold uppercase text-xs">Pendente Repasse</p>
            </div>
            <p className="text-4xl font-black text-slate-900 italic">R$ {stats.pendenteRepasse.toFixed(2)}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-blue-100 p-3 rounded-2xl"><Truck className="text-blue-600" /></div>
              <p className="text-slate-400 font-bold uppercase text-xs">Total Transacionado</p>
            </div>
            <p className="text-4xl font-black text-slate-900 italic">R$ {stats.totalBruto.toFixed(2)}</p>
          </div>
        </div>

        {/* LISTA DE REPASSES PENDENTES (O SEU TRABALHO DIÁRIO) */}
        <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
           <DollarSign className="text-green-600" /> Repasses para Fazer (24h)
        </h2>

        <div className="grid gap-4">
          {fretes.filter(f => f.status === 'entregue_aguardando_repasse').map(f => (
            <div key={f.id} className="bg-white p-6 rounded-3xl shadow-md border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-4 text-left w-full">
                  <div className="bg-slate-100 p-4 rounded-2xl font-black text-xl italic text-slate-400">#PIX</div>
                  <div>
                    <p className="text-xs font-black text-blue-600 uppercase">Motorista: {f.motoristaNome}</p>
                    <p className="font-bold text-slate-800">Chave: {f.motoristaZap || 'Ver no cadastro'}</p>
                    <p className="text-[10px] text-slate-400">Finalizado em: {new Date(f.finishedAt?.seconds * 1000).toLocaleString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400">Valor Líquido</p>
                    <p className="text-2xl font-black text-green-600 italic">{f.valorMotorista}</p>
                  </div>
                  <button 
                    onClick={() => confirmarPagamento(f.id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-black px-6 py-4 rounded-2xl uppercase text-xs transition-all shadow-lg"
                  >
                    Confirmar Pix
                  </button>
               </div>
            </div>
          ))}
          {fretes.filter(f => f.status === 'entregue_aguardando_repasse').length === 0 && (
            <div className="text-center p-10 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-bold italic">Nenhum repasse pendente no momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
