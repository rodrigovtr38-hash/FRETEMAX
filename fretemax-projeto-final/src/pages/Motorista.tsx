import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Loader2, Navigation, Smartphone, Zap, Weight, Gauge, Package, Building2, MapPin, ArrowLeft } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, 'motoristas_cadastros'), where('email', '==', user.email));
        return onSnapshot(q, (snap) => {
          if (!snap.empty) setDriverData(snap.docs[0].data());
          setLoading(false);
        });
      } else { setLoading(false); }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (driverData?.status === 'aprovado') {
      const q = query(collection(db, 'fretes'), where('status', '==', 'pago'));
      return onSnapshot(q, (snap) => {
        setAvailableFretes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [driverData]);

  const handleAccept = async (freteId: string) => {
    if (!window.confirm("Confirmar aceite deste frete?")) return;
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        status: 'motorista_a_caminho', motoristaNome: driverData.nome, motoristaZap: driverData.whatsapp, motoristaEmail: user.email, acceptedAt: serverTimestamp()
      });
    } catch (e) { alert("Erro ao aceitar."); }
  };

  const handleLogout = () => signOut(auth);

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {user && <ArrowLeft onClick={handleLogout} className="text-white cursor-pointer w-5 h-5 mr-1" />}
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black italic text-xl uppercase tracking-tighter">FRETOGO</span>
        </div>
        <span className="text-[10px] bg-blue-600 px-3 py-1 rounded-full font-black uppercase">Radar Pro</span>
      </nav>

      <div className="max-w-md mx-auto p-4">
        {!user ? (
          <button onClick={() => signInWithPopup(auth, provider)} className="w-full mt-20 bg-blue-600 p-5 rounded-2xl font-black uppercase italic tracking-widest shadow-2xl">ENTRAR NO RADAR</button>
        ) : (
          <div className="space-y-4">
            <h2 className="text-green-400 font-black italic flex items-center gap-2 mb-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> FRETES DISPONÍVEIS NA REGIÃO
            </h2>
            
            {availableFretes.length === 0 ? (
              <div className="text-center p-20 border-2 border-dashed border-slate-800 rounded-3xl"><p className="text-slate-600 font-bold italic">Ouvindo cargas...</p></div>
            ) : (
              availableFretes.map((f: any) => (
                <div key={f.id} className="bg-white rounded-[2rem] p-6 text-slate-900 shadow-2xl border-l-[12px] border-blue-600">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /><span className="font-black text-[10px] uppercase">Fretogo Parceiro</span></div>
                    <span className="text-2xl font-black text-green-600 italic">{f.valorFinal}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2"><Gauge className="w-4 h-4 text-blue-500" /><p className="text-[11px] font-black">{f.distancia} KM</p></div>
                    <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2"><Weight className="w-4 h-4 text-blue-500" /><p className="text-[11px] font-black">{f.peso} KG</p></div>
                  </div>
                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                    <div className="flex gap-2"><MapPin className="w-4 h-4 text-blue-600 mt-1" /><div><p className="text-[8px] font-black text-slate-400 uppercase">Coleta (Bairro)</p><p className="text-xs font-black">{f.origemBairro}</p></div></div>
                    <div className="flex gap-2"><Navigation className="w-4 h-4 text-orange-500 mt-1" /><div><p className="text-[8px] font-black text-slate-400 uppercase">Entrega (Bairro)</p><p className="text-xs font-black">{f.destinoBairro}</p></div></div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200"><Package className="w-4 h-4 text-blue-600" /><p className="text-[10px] font-black uppercase text-blue-700">{f.tipoCarga}</p></div>
                  </div>
                  <button onClick={() => handleAccept(f.id)} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-lg uppercase italic tracking-tighter active:scale-95 transition-all">ACEITAR FRETE</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
