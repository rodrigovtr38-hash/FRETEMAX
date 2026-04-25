import { useState, useEffect } from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, serverTimestamp, setDoc, runTransaction } from 'firebase/firestore';
import { Loader2, Truck, CheckCircle } from 'lucide-react';

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [activeFrete, setActiveFrete] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        onSnapshot(query(collection(db, 'motoristas_cadastros'), where('email', '==', currentUser.email)), (snap) => {
          if (!snap.empty) setDriverData({ id: snap.docs[0].id, ...snap.docs[0].data() });
        });
        
        const qActive = query(collection(db, 'fretes'), where('motoristaId', '==', currentUser.uid), where('status', 'in', ['aceito', 'coleta', 'em_transporte']));
        onSnapshot(qActive, (snap) => {
          if (!snap.empty) setActiveFrete({ id: snap.docs[0].id, ...snap.docs[0].data() });
          else setActiveFrete(null);
          setLoading(false);
        });
      } else { setUser(null); setLoading(false); }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user && driverData?.status === 'aprovado' && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition((pos) => {
        setDoc(doc(db, 'motoristas_online', user.uid), {
          nome: driverData.nome, categoria: driverData.categoria,
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          status: activeFrete ? 'ocupado' : 'disponivel',
          lastSeen: serverTimestamp()
        }, { merge: true });
      }, null, { enableHighAccuracy: true });
      return () => {
         navigator.geolocation.clearWatch(watchId);
         if (user) setDoc(doc(db, 'motoristas_online', user.uid), { status: 'offline' }, { merge: true });
      };
    }
  }, [driverData, user, activeFrete]);

  useEffect(() => {
    if (driverData?.status === 'aprovado' && !activeFrete) {
      const q = query(collection(db, 'fretes'), where('status', '==', 'aguardando_motorista'));
      return onSnapshot(q, (snap) => {
        const categoria = driverData.categoria?.toLowerCase().trim();
        setAvailableFretes(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => f.veiculo?.toLowerCase().trim() === categoria));
      });
    }
  }, [driverData, activeFrete]);

  const handleAccept = async (frete: any) => {
    if (!user || driverData?.status !== 'aprovado') return;
    try {
      const freteRef = doc(db, 'fretes', frete.id);
      await runTransaction(db, async (t) => {
        const d = await t.get(freteRef);
        const data = d.data();
        if (!d.exists() || data?.status !== 'aguardando_motorista' || data?.motoristaId) throw new Error("Carga indisponível.");
        
        t.update(freteRef, {
          status: 'aceito',
          motoristaId: user.uid, motoristaNome: driverData.nome, motoristaZap: driverData.whatsapp,
          logs: [...(data?.logs || []), { tipo: "aceito", data: new Date().toISOString() }]
        });
      });
      await setDoc(doc(db, 'motoristas_online', user.uid), { status: 'ocupado' }, { merge: true });
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateStatus = async (novoStatus: string) => {
    if (!activeFrete) return;
    const ref = doc(db, 'fretes', activeFrete.id);
    await runTransaction(db, async (t) => {
      const d = await t.get(ref);
      t.update(ref, { 
        status: novoStatus, 
        logs: [...(d.data()?.logs || []), { tipo: novoStatus, data: new Date().toISOString() }] 
      });
    });
    if (novoStatus === 'entregue') {
        await setDoc(doc(db, 'motoristas_online', user.uid), { status: 'disponivel' }, { merge: true });
    }
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-800 font-black italic">
        FRETOGO <button onClick={() => signOut(auth)} className="text-xs text-slate-500 font-bold bg-slate-800 px-3 py-1 rounded-full">SAIR</button>
      </nav>

      <div className="p-4 max-w-md mx-auto">
        {!user ? (
          <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-blue-600 p-5 rounded-2xl font-black uppercase italic shadow-xl">ENTRAR NO RADAR</button>
        ) : activeFrete ? (
          <div className="bg-slate-900 p-6 rounded-[2rem] border border-blue-500/30 animate-in zoom-in">
            <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-500"/> Carga Ativa</h2>
            <div className="grid gap-3">
              {activeFrete.status === 'aceito' && <button onClick={() => handleUpdateStatus('coleta')} className="bg-blue-600 p-4 rounded-xl font-black uppercase text-sm">COLETEI A CARGA</button>}
              {activeFrete.status === 'coleta' && <button onClick={() => handleUpdateStatus('em_transporte')} className="bg-orange-500 p-4 rounded-xl font-black uppercase text-sm">INICIAR TRANSPORTE</button>}
              {activeFrete.status === 'em_transporte' && <button onClick={() => handleUpdateStatus('entregue')} className="bg-green-600 p-4 rounded-xl font-black uppercase text-sm flex gap-2 justify-center"><CheckCircle className="w-4 h-4"/> FINALIZAR ENTREGA</button>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             {availableFretes.length === 0 ? <p className="text-center text-slate-500 py-20 italic">Buscando fretes pagos...</p> : 
               availableFretes.map(f => (
                 <div key={f.id} className="bg-white text-slate-900 p-6 rounded-[2rem] shadow-xl border-b-8 border-blue-600">
                    <p className="text-4xl font-black text-green-600 italic mb-4">R$ {f.valorMotorista?.toFixed(2)}</p>
                    <button onClick={() => handleAccept(f)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase italic">ACEITAR E COLETAR</button>
                 </div>
               ))
             }
          </div>
        )}
      </div>
    </div>
  );
}
