import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Map as MapIcon, Loader2, Navigation, Smartphone, ArrowLeft, AlertCircle, Weight, Gauge } from 'lucide-react';

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
      const q = query(collection(db, 'fretes'), where('status', '==', 'aguardando_motorista'));
      return onSnapshot(q, (snapshot) => {
        const fretes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableFretes(fretes);
      });
    }
  }, [driverData]);

  const handleAccept = async (freteId: string) => {
    if (!window.confirm("Deseja aceitar este frete agora?")) return;
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        status: 'motorista_a_caminho',
        motoristaNome: driverData.nome,
        motoristaZap: driverData.whatsapp || 'Não informado',
        acceptedAt: serverTimestamp()
      });
    } catch (e) { alert("Erro ao aceitar frete."); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <nav className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-4">
        <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-700 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
        <span className="font-bold uppercase tracking-widest text-[10px]">Radar de Fretes</span>
      </nav>

      <div className="max-w-md mx-auto p-4 pb-20">
        {!user ? (
          <div className="mt-10 bg-white p-8 rounded-3xl text-slate-800 text-center shadow-2xl">
            <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase italic">Portal do Parceiro</h2>
            <button onClick={() => signInWithPopup(auth, provider)} className="w-full mt-6 bg-blue-600 text-white font-black py-5 rounded-2xl">ENTRAR COM GOOGLE</button>
          </div>
        ) : driverData?.status === 'aprovado' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mt-4">
               <div className="flex items-center gap-2 font-black italic text-green-400">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> RADAR ONLINE
               </div>
               <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-bold uppercase">{driverData.categoria}</span>
            </div>

            {availableFretes.length === 0 ? (
              <div className="bg-slate-800/50 p-12 rounded-[2rem] border border-slate-700 text-center border-dashed">
                <Loader2 className="animate-spin mx-auto mb-4 text-slate-600" />
                <p className="text-slate-500 text-sm italic">Ouvindo novos fretes...</p>
              </div>
            ) : (
              availableFretes.map((frete: any) => (
                <div key={frete.id} className="bg-white rounded-[2rem] p-6 text-slate-800 border-l-[12px] border-green-500 shadow-2xl animate-in slide-in-from-right duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase">{frete.veiculo}</span>
                    <span className="text-green-600 font-black text-2xl">{frete.valorFinal}</span>
                  </div>

                  {/* NOVAS INFORMAÇÕES ADICIONADAS AQUI */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2">
                       <Weight className="w-4 h-4 text-slate-400" />
                       <div>
                         <p className="text-[9px] uppercase font-bold text-slate-400">Peso</p>
                         <p className="text-xs font-black">{frete.peso || 'N/A'}</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2">
                       <Gauge className="w-4 h-4 text-slate-400" />
                       <div>
                         <p className="text-[9px] uppercase font-bold text-slate-400">Distância</p>
                         <p className="text-xs font-black">{frete.distancia} KM</p>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 text-left border-t pt-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-10 bg-slate-100"></div>
                        <Navigation className="w-3 h-3 text-orange-500" />
                      </div>
                      <div className="text-[13px] leading-snug">
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Coleta</p>
                        <p className="font-bold mb-3">{frete.cidadeOrigem}</p>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Entrega</p>
                        <p className="font-bold">{frete.cidadeDestino}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleAccept(frete.id)} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl text-lg shadow-xl active:scale-95 transition-all uppercase tracking-tighter">ACEITAR AGORA</button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-12 bg-white p-8 rounded-3xl text-center text-slate-800 shadow-xl">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase text-slate-700">Conta em Análise</h2>
            <p className="text-slate-500 mt-2">Aguarde a liberação do seu perfil.</p>
          </div>
        )}
      </div>
    </div>
  );
}
