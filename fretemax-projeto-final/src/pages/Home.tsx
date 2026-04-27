import { useState, useEffect } from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, serverTimestamp, setDoc, runTransaction } from 'firebase/firestore';

export default function Motorista() {

  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [activeFrete, setActiveFrete] = useState<any>(null);

  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);

        onSnapshot(
          query(collection(db, 'motoristas_cadastros'), where('email', '==', u.email)),
          (snap) => {
            if (!snap.empty) setDriverData({ id: snap.docs[0].id, ...snap.docs[0].data() });
          }
        );

        onSnapshot(
          query(collection(db, 'fretes'), where('motoristaId', '==', u.uid)),
          (snap) => {
            const ativo = snap.docs.find(d =>
              ['aceito', 'coleta', 'em_transporte'].includes(d.data().status)
            );

            setActiveFrete(ativo ? { id: ativo.id, ...ativo.data() } : null);
          }
        );
      } else {
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!driverData || activeFrete) return;

    return onSnapshot(
      query(collection(db, 'fretes'), where('status', '==', 'aguardando_motorista')),
      (snap) => {
        const categoria = driverData.categoria?.toLowerCase().trim();

        const lista = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(f => f.veiculo === categoria);

        setAvailableFretes(lista);
      }
    );
  }, [driverData, activeFrete]);

  const handleAccept = async (frete: any) => {
    const ref = doc(db, 'fretes', frete.id);

    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(ref);

        if (!snap.exists()) throw new Error('Frete não existe');

        const data = snap.data();

        if (data.status !== 'aguardando_motorista') throw new Error('Já foi aceito');

        t.update(ref, {
          status: 'aceito',
          motoristaId: user.uid,
          motoristaNome: driverData.nome,
          motoristaZap: driverData.whatsapp,
          logs: [...(data.logs || []), { tipo: 'aceito', data: new Date().toISOString() }]
        });
      });

    } catch (e: any) {
      alert(e.message);
    }
  };

  const updateStatus = async (status: string) => {
    const ref = doc(db, 'fretes', activeFrete.id);

    await runTransaction(db, async (t) => {
      const snap = await t.get(ref);

      t.update(ref, {
        status,
        logs: [...(snap.data()?.logs || []), { tipo: status, data: new Date().toISOString() }]
      });
    });
  };

  return (
    <div style={{ padding: 20 }}>
      {!user ? (
        <button onClick={() => signInWithPopup(auth, provider)}>
          Entrar
        </button>
      ) : activeFrete ? (
        <div>
          <h2>Frete ativo</h2>

          <p>{activeFrete.coleta?.cep} → {activeFrete.entrega?.cep}</p>
          <p>R$ {activeFrete.valorMotorista}</p>

          {activeFrete.status === 'aceito' && (
            <button onClick={() => updateStatus('coleta')}>Coletar</button>
          )}

          {activeFrete.status === 'coleta' && (
            <button onClick={() => updateStatus('em_transporte')}>Transportar</button>
          )}

          {activeFrete.status === 'em_transporte' && (
            <button onClick={() => updateStatus('entregue')}>Finalizar</button>
          )}
        </div>
      ) : (
        <div>
          <h2>Fretes disponíveis</h2>

          {availableFretes.map(f => (
            <div key={f.id}>
              <p>R$ {f.valorMotorista}</p>
              <button onClick={() => handleAccept(f)}>Aceitar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
