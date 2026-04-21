import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, Map as MapIcon, Loader2, Navigation, Smartphone, ArrowLeft, AlertCircle, Weight, Gauge, CheckCircle2 } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [currentJob, setCurrentJob] = useState<any>(null); // NOVO: Carga atual
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

  // ANTENA 1: ESCUTA CARGAS DISPONÍVEIS (RADAR)
  useEffect(() => {
    if (driverData?.status === 'aprovado') {
      const q = query(collection(db, 'fretes'), where('status', '==', 'aguardando_motorista'));
      return onSnapshot(q, (snapshot) => {
        const fretes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableFretes(fretes);
      });
    }
  }, [driverData]);

  // ANTENA 2: ESCUTA SE O MOTORISTA TEM UMA VIAGEM EM ANDAMENTO
  useEffect(() => {
    if (user && driverData?.status === 'aprovado') {
      const q = query(collection(db, 'fretes'), where('motoristaEmail', '==', user.email), where('status', '==', 'motorista_a_caminho'));
      return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setCurrentJob({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setCurrentJob(null);
        }
      });
    }
  }, [user, driverData]);

  const handleAccept = async (freteId: string) => {
    if (!window.confirm("Deseja aceitar este frete agora?")) return;
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        status: 'motorista_a_caminho',
        motoristaNome: driverData.nome,
        motoristaZap: driverData.whatsapp || 'Não informado',
        motoristaEmail: user.email, // Salva o email para a "Antena 2" funcionar
        acceptedAt: serverTimestamp()
      });
    } catch (e) { alert("Erro ao aceitar."); }
  };

  const handleFinish = async () => {
    if (!window.confirm("Confirmar entrega da carga?")) return;
    try {
      await updateDoc(doc(db, 'fretes', currentJob.id), {
        status: 'entregue',
        finishedAt: serverTimestamp()
      });
      alert("Parabéns pela entrega!");
    } catch (e) { alert("Erro ao finalizar."); }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <nav className="bg-slate-800 p-4 border-b border-slate-700 flex items-center gap-4">
        <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-slate-700 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
        <span className="font-bold uppercase tracking-widest text-[10px]">Painel Operacional</span>
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
            {/* INTERFACE DE CARGA EM ANDAMENTO */}
            {currentJob ? (
              <div className="mt-4 animate-in zoom-in duration-300">
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                   <h1 className="text-xl font-black italic uppercase text-yellow-500">Viagem em Curso</h1>
                </div>
                
                <div className="bg-white rounded-[2rem] p-8 text-slate-800 shadow-2xl border-t-[12px] border-yellow-500">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Responsável</p>
                      <p className="text-lg font-black text-blue-600">{currentJob.responsavel}</p>
                    </div>
                    <span className="text-green-600 font-black text-2xl">{currentJob.valorFinal}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <p className="text-[9px] uppercase font-bold text-slate-400">Peso</p>
                       <p className="text-xs font-black">{currentJob.peso}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                       <p className="text-[9px] uppercase font-bold text-slate-400">Carga</p>
                       <p className="text-xs font-black">{currentJob.material}</p>
                    </div>
                  </div>

                  <div className="space-y-6 mb-10 text-left">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-10 bg-slate-100"></div>
                        <Navigation className="w-3 h-3 text-orange-500" />
                      </div>
                      <div className="text-[13px] leading-snug">
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Coleta em:</p>
                        <p className="font-bold mb-3">{currentJob.cidadeOrigem}</p>
                        <p className="text-slate-400 font-bold uppercase text-[9px]">Entregar em:</p>
                        <p className="font-bold">{currentJob.cidadeDestino}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button onClick={() => window.open(`https://wa.me/55${currentJob.responsavelZap || '11999999999'}?text=Olá, sou o motorista ${driverData.nome} do FreteMax. Estou a caminho da coleta!`)} className="w-full bg-green-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-green-700 transition-all text-lg">
                      <Smartphone /> FALAR COM CLIENTE
                    </button>
                    <button onClick={handleFinish} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest opacity-80 hover:opacity-100 transition-all">
                      FINALIZAR E LIBERAR RADAR
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* INTERFACE DO RADAR (OCULTA SE TIVER VIAGEM) */
              <>
                <div className="flex justify-between items-center mt-4">
                   <div className="flex items-center gap-2 font-black italic text-green-400">
                     <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> RADAR ONLINE
                   </div>
                   <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full border border-slate-700 font-bold uppercase">{driverData.categoria}</span>
                </div>

                {availableFretes.length === 0 ? (
                  <div className="bg-slate-800/50 p-12 rounded-[2rem] border border-slate-700 text-center border-dashed">
                    <Loader2 className="animate-spin mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-500 text-sm italic">Procurando fretes de {driverData.categoria}...</p>
                  </div>
                ) : (
                  availableFretes.map((frete: any) => (
                    <div key={frete.id} className="bg-white rounded-[2rem] p-6 text-slate-800 border-l-[12px] border-green-500 shadow-2xl animate-in fade-in slide-in-from-right duration-500">
                      <div className="flex justify-between items-center mb-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase">{frete.veiculo}</span>
                        <span className="text-green-600 font-black text-2xl">{frete.valorFinal}</span>
                      </div>

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
              </>
            )}
          </div>
        ) : (
          <div className="mt-12 bg-white p-8 rounded-3xl text-center text-slate-800 shadow-xl">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black italic uppercase text-slate-700">Conta em Análise</h2>
            <p className="text-slate-500 mt-2">Aguarde a liberação do seu radar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
