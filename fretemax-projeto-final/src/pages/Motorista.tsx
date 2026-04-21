import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Navigation, Zap, Weight, Gauge, Package, MapPin, Clock, Truck, ShieldAlert } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Verifica quem logou e puxa os dados de aprovação
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, 'motoristas_cadastros'), where('email', '==', user.email));
        return onSnapshot(q, (snap) => {
          if (!snap.empty) {
             setDriverData(snap.docs[0].data());
          }
          setLoading(false);
        });
      } else { 
        setLoading(false); 
      }
    });
    return () => unsub();
  }, []);

  // 2. O PULO DO GATO: Só busca fretes "PAGOS" se o motorista for "APROVADO"
  useEffect(() => {
    if (driverData?.status === 'aprovado') {
      const q = query(collection(db, 'fretes'), where('status', '==', 'pago'));
      return onSnapshot(q, (snap) => {
        // Opcional: Aqui poderíamos filtrar no JS para mostrar só fretes da categoria dele
        // const fretes = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => f.veiculo === driverData.categoria);
        setAvailableFretes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [driverData]);

  // 3. Ação de Aceite (Libera o contato para o Cliente)
  const handleAccept = async (freteId: string, veiculoExigido: string) => {
    if (!window.confirm(`Você confirma que possui o veículo: ${veiculoExigido}?`)) return;
    
    try {
      await updateDoc(doc(db, 'fretes', freteId), {
        status: 'motorista_a_caminho', 
        motoristaNome: driverData.nome || 'Motorista Verificado', 
        motoristaZap: driverData.whatsapp || '', 
        motoristaEmail: user.email, 
        acceptedAt: serverTimestamp()
      });
      alert("Frete aceito! O cliente já recebeu seu contato.");
    } catch (e) { 
      alert("Erro ao aceitar. Outro motorista pode ter pegado a carga."); 
    }
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-10">
      <nav className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between shadow-2xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black italic text-xl uppercase tracking-tighter text-white">FRETOGO</span>
        </div>
        <span className="text-[10px] bg-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-wider animate-pulse">Radar Online</span>
      </nav>

      <div className="max-w-md mx-auto p-4 mt-2">
        {!user ? (
          /* TELA DE LOGIN DO MOTORISTA */
          <div className="mt-20 text-center">
             <Truck className="w-16 h-16 text-slate-700 mx-auto mb-6" />
             <h2 className="text-2xl font-black italic uppercase mb-2">Área do Motorista</h2>
             <p className="text-slate-400 text-sm mb-8 font-medium">Acesse o radar para receber cargas na sua região.</p>
             <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-blue-600 hover:bg-blue-700 p-5 rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl shadow-blue-900/50 active:scale-95">
                ENTRAR NO RADAR
             </button>
          </div>
        ) : driverData?.status !== 'aprovado' ? (
          /* TELA DE ESPERA DE APROVAÇÃO (Trava de Segurança) */
          <div className="mt-20 text-center bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
             <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
             <h2 className="text-xl font-black italic uppercase text-white mb-2">Cadastro em Análise</h2>
             <p className="text-slate-400 text-sm font-medium">
               Sua conta está passando por verificação de segurança. Assim que aprovada, as cargas aparecerão aqui.
             </p>
          </div>
        ) : (
          /* TELA DO RADAR (Máquina de Dinheiro) */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-green-400 font-black italic flex items-center gap-2 text-sm uppercase tracking-widest">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" /> Cargas Pagas Disponíveis
               </h2>
               <span className="bg-slate-800 text-[10px] px-2 py-1 rounded font-bold">{availableFretes.length} Frete(s)</span>
            </div>
            
            {availableFretes.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/50">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin-slow">
                    <Zap className="w-8 h-8 text-slate-600" />
                 </div>
                 <p className="text-slate-500 font-bold italic tracking-wide">Buscando novas cargas...</p>
              </div>
            ) : (
              availableFretes.map((f: any) => (
                <div key={f.id} className="bg-white rounded-[2rem] p-6 text-slate-900 shadow-2xl border-l-[12px] border-blue-600 animate-in slide-in-from-bottom-4 duration-300">
                  
                  {/* Cabeçalho do Frete */}
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="font-black text-[11px] uppercase text-slate-500">Postado às {f.horario}</span>
                    </div>
                    <span className="text-3xl font-black text-green-600 italic tracking-tighter">{f.valorFinal}</span>
                  </div>

                  {/* Tag do Veículo Exigido (Novo) */}
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-2 mb-4">
                     <Truck className="w-5 h-5 text-blue-600" />
                     <div>
                        <p className="text-[9px] font-black uppercase text-blue-400">Veículo Exigido pelo Cliente</p>
                        <p className="text-sm font-black text-blue-800 uppercase italic">{f.veiculo}</p>
                     </div>
                  </div>

                  {/* Informações de Distância e Peso */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
                       <Gauge className="w-5 h-5 text-slate-400" />
                       <p className="text-[12px] font-black text-slate-700">{f.distancia} KM</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
                       <Weight className="w-5 h-5 text-slate-400" />
                       <p className="text-[12px] font-black text-slate-700">{f.peso} KG</p>
                    </div>
                  </div>

                  {/* Rota e Material */}
                  <div className="space-y-4 mb-6 bg-slate-50 border border-slate-100 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute left-7 top-6 bottom-16 w-0.5 bg-slate-200"></div>
                    <div className="flex gap-3 relative z-10">
                       <div className="bg-white p-1 rounded-full shadow-sm"><MapPin className="w-4 h-4 text-blue-600" /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Coleta</p>
                          <p className="text-sm font-black text-slate-800">{f.origemBairro}</p>
                       </div>
                    </div>
                    <div className="flex gap-3 relative z-10">
                       <div className="bg-white p-1 rounded-full shadow-sm"><Navigation className="w-4 h-4 text-orange-500" /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Entrega</p>
                          <p className="text-sm font-black text-slate-800">{f.destinoBairro}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                       <Package className="w-4 h-4 text-slate-500" />
                       <p className="text-[10px] font-black uppercase text-slate-600">Carga: {f.tipoCarga}</p>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <button onClick={() => handleAccept(f.id, f.veiculo)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[1.5rem] text-lg uppercase italic tracking-wider active:scale-95 transition-all shadow-xl shadow-slate-900/20">
                     ACEITAR CARGA AGORA
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
