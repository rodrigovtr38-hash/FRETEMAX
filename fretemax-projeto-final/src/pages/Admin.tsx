import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, query, orderBy, runTransaction } from 'firebase/firestore';
import { List, Search, Loader2 } from 'lucide-react';

export default function Admin() {
  const [fretes, setFretes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'fretes'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
       setFretes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
       setLoading(false);
    });
  }, []);

  const fretesFiltrados = fretes.filter(f => {
    const matchSearch = f.id.includes(searchTerm) || f.motoristaNome?.toLowerCase().includes(searchTerm.toLowerCase()) || f.cidadeOrigem?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'todos' || f.status === filter;
    return matchSearch && matchFilter;
  });

  const totalFaturado = fretes.reduce((acc, f) => acc + (Number(f.valorTotal) || 0), 0);
  const totalLucro = fretes.reduce((acc, f) => acc + (Number(f.lucroPlataforma) || 0), 0);
  const repassesPendentes = fretes.filter(f => f.status === 'entregue' || f.status === 'aguardando_repasse').length;

  const forceStatus = async (id: string, novoStatus: string) => {
    if(!window.confirm(`ATENÇÃO: Mudar status para ${novoStatus.toUpperCase()}?`)) return;
    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'fretes', id);
        const d = await t.get(ref);
        const data = d.data();
        
        // Bloqueio de Segurança: Não cancelar frete já aceito
        if (novoStatus === 'cancelado' && ['aceito', 'coleta', 'em_transporte', 'entregue', 'finalizado'].includes(data?.status)) {
            throw new Error("Não é possível cancelar uma carga em andamento.");
        }

        t.update(ref, { 
           status: novoStatus, 
           logs: [...(data?.logs || []), { tipo: `admin_forced_${novoStatus}`, data: new Date().toISOString() }] 
        });
      });
      alert(`Status atualizado para ${novoStatus}.`);
    } catch(e: any) { 
      alert(e.message || 'Erro ao atualizar no banco de dados.'); 
    }
  };

  if (loading) return <div className="h-screen bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <h1 className="text-3xl font-black italic uppercase text-slate-900 mb-8">Painel Executivo Fretogo</h1>
      
      {/* DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-md border-l-8 border-green-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Faturamento Bruto</p>
          <p className="text-3xl font-black text-slate-900">R$ {totalFaturado.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-md border-l-8 border-blue-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Lucro Fretogo (20%)</p>
          <p className="text-3xl font-black text-blue-600">R$ {totalLucro.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-md border-l-8 border-orange-500">
          <p className="text-xs font-bold text-slate-400 uppercase">Aguardando Repasse</p>
          <p className="text-3xl font-black text-orange-500">{repassesPendentes}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-md border-l-8 border-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase">Volume Total</p>
          <p className="text-3xl font-black text-slate-800">{fretes.length}</p>
        </div>
      </div>

      {/* CONTROLE DE CARGAS */}
      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
            <input className="w-full pl-12 p-4 bg-slate-50 rounded-xl font-bold outline-none" placeholder="Buscar ID, Motorista ou Cidade..." onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <select className="p-4 font-bold bg-slate-50 rounded-xl outline-none uppercase text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
             <option value="todos">Todos os Status</option>
             <option value="aguardando_pagamento">Aguardando Pgto</option>
             <option value="aguardando_motorista">Aguardando Motorista</option>
             <option value="aceito">Aceito / Coleta</option>
             <option value="em_transporte">Em Transporte</option>
             <option value="entregue">Entregue (Pendente)</option>
             <option value="finalizado">Finalizado / Pago</option>
             <option value="erro_pagamento">Erro Pagamento</option>
             <option value="cancelado">Cancelado</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-4">ID / Origem</th>
                <th className="p-4">Status Unificado</th>
                <th className="p-4">Motorista</th>
                <th className="p-4 text-right">Controle Administrativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fretesFiltrados.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                     <p className="font-black text-slate-900 text-xs uppercase mb-1">...{f.id.slice(-6)}</p>
                     <p className="text-[10px] text-slate-500 font-bold">{f.cidadeOrigem}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${['aguardando_pagamento', 'erro_pagamento', 'cancelado'].includes(f.status) ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {f.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-700">{f.motoristaNome || 'N/A'}</td>
                  <td className="p-4 flex gap-2 justify-end">
                     {(f.status === 'entregue' || f.status === 'aguardando_repasse') && (
                       <button onClick={() => forceStatus(f.id, 'finalizado')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 transition-all">Liberar PIX Motorista</button>
                     )}
                     {['aguardando_pagamento', 'aguardando_motorista', 'erro_pagamento'].includes(f.status) && (
                       <button onClick={() => forceStatus(f.id, 'cancelado')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 transition-all">Cancelar Frete</button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
