import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, query, orderBy, runTransaction } from 'firebase/firestore';
import { Search, Loader2 } from 'lucide-react';

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
    const matchSearch =
      f.id.includes(searchTerm) ||
      f.motoristaNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cidadeOrigem?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter = filter === 'todos' || f.status === filter;

    return matchSearch && matchFilter;
  });

  // 🔥 MÉTRICAS REAIS
  const totalFaturado = fretes
    .filter(f => ['aceito','coleta','em_transporte','entregue','finalizado'].includes(f.status))
    .reduce((acc, f) => acc + (Number(f.valorTotal) || 0), 0);

  const totalLucro = fretes
    .filter(f => ['aceito','coleta','em_transporte','entregue','finalizado'].includes(f.status))
    .reduce((acc, f) => acc + (Number(f.lucroPlataforma) || 0), 0);

  const repassesPendentes = fretes.filter(f => f.status === 'entregue').length;

  const forceStatus = async (id: string, novoStatus: string) => {
    if (!window.confirm(`Alterar status para ${novoStatus}?`)) return;

    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'fretes', id);
        const d = await t.get(ref);
        const data = d.data();

        if (!d.exists()) throw new Error("Frete não encontrado");

        t.update(ref, {
          status: novoStatus,
          logs: [
            ...(data?.logs || []),
            { tipo: `admin_${novoStatus}`, data: new Date().toISOString() }
          ]
        });
      });

      alert('Atualizado com sucesso');
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black mb-6">PAINEL FRETOGO</h1>

      {/* DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>Faturamento: R$ {totalFaturado.toFixed(2)}</div>
        <div>Lucro: R$ {totalLucro.toFixed(2)}</div>
        <div>Pendentes: {repassesPendentes}</div>
        <div>Total: {fretes.length}</div>
      </div>

      {/* BUSCA */}
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Buscar..."
          onChange={e => setSearchTerm(e.target.value)}
          className="border p-2 w-full"
        />

        <select onChange={e => setFilter(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="aguardando_pagamento">Aguardando Pgto</option>
          <option value="aguardando_motorista">Aguardando Motorista</option>
          <option value="aceito">Aceito</option>
          <option value="em_transporte">Em Transporte</option>
          <option value="entregue">Entregue</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* LISTA */}
      <div>
        {fretesFiltrados.map(f => (
          <div key={f.id} className="border p-4 mb-2">
            <p>ID: {f.id}</p>
            <p>Status: {f.status}</p>
            <p>Motorista: {f.motoristaNome || '---'}</p>

            {f.status === 'entregue' && (
              <button onClick={() => forceStatus(f.id, 'finalizado')}>
                Liberar pagamento
              </button>
            )}

            {['aguardando_pagamento','erro_pagamento'].includes(f.status) && (
              <button onClick={() => forceStatus(f.id, 'cancelado')}>
                Cancelar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
