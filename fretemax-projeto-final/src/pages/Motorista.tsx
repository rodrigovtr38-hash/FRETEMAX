import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Map as MapIcon, Loader2, Navigation, Smartphone, ArrowLeft, AlertCircle } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, 'motoristas_cadastros'), where('email', '==', user.email));
        return onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) setDriverData(snapshot.docs[0].data());
          setLoading(false);
        });
      } else { setLoading(false); }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (driverData?.status === 'aprovado') {
      const q = query(collection(db, 'fretes'), where('status', '==', 'aguardando_motorista'), where('veiculo', '==', driverData.categoria));
      return onSnapshot(q, (snapshot) => {
        const fretes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableFretes(fretes);
      });
    }
  }, [driverData]);

  const handleAccept = async (freteId: string) => {
    const confirm = window.confirm("Deseja aceitar este frete?");
    if (!confirm) return;
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        status: 'motorista_a_caminho',
        motoristaNome: driverData.nome,
        motoristaZap: driverData.whatsapp || 'Não informado',
        acceptedAt: serverTimestamp()
      });
      alert("Frete aceito! Verifique os detalhes no radar.");
    } catch (e) { alert("Erro ao aceitar."); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center gap-4">
        <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <span className="font-bold text-sm tracking-widest uppercase">Radar do Parceiro</span>
      </nav>

      <div className="max-w-md mx-auto p-4 pb-20">
        {!user ? (
          <div className="mt-10 bg-white p-8 rounded-2xl text-slate-800 text-center">
            <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Portal do Parceiro</h1>
            <button onClick={() => signInWithPopup(auth, provider)} className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200">Entrar com Google</button>
          </div>
        ) : driverData?.status === 'aprovado' ? (
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
               <h1 className="text-xl font-black text-green-400">ONLINE</h1>
               <span className="bg-slate-800 text-[10px] px-3 py-1 rounded-full border border-slate-700">{driverData.categoria}</span>
            </div>

            {availableFretes.length === 0 ? (
              <div className="bg-slate-800/50 p-12 rounded-3xl border border-dashed border-slate-700 text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-slate-600" />
                <p className="text-slate-500 text-sm italic">Ouvindo novos fretes na sua região...</p>
              </div>
            ) : (
              availableFretes.map((frete) => (
                <div key={frete.id} className="bg-white rounded-3xl p-6 text-slate-800 border-l-[12px] border-green-500 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{frete.veiculo}</span>
                    <span className="text-green-600 font-black text-2xl">{frete.valorFinal}</span>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-blue-100"></div>
                        <div className="w-0.5 h-8 bg-slate-100"></div>
                        <Navigation className="w-3 h-3 text-orange-500" />
                      </div>
                      <div className="text-[13px] leading-snug">
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Origem</p>
                        <p className="font-bold">{frete.cidadeOrigem}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mt-3">Destino</p>
                        <p className="font-bold">{frete.cidadeDestino}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleAccept(frete.id)} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl hover:bg-green-700 active:scale-95 transition-all shadow-xl shadow-green-100 text-lg uppercase tracking-tighter">
                    ACEITAR AGORA
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-12 bg-white p-8 rounded-2xl text-center text-slate-800">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Conta em Análise</h2>
            <p className="text-slate-500 mt-2">Nossa equipe está validando seus documentos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
