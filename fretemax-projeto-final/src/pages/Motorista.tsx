import { useState, useEffect } from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, serverTimestamp, setDoc, runTransaction } from 'firebase/firestore';
import { Loader2, Navigation, Zap, Weight, Gauge, Package, MapPin, Clock, Truck, ShieldAlert, Download, MessageCircle, UserCheck } from 'lucide-react';

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [availableFretes, setAvailableFretes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // 1. Auth e Puxa dados do Perfil
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const q = query(collection(db, 'motoristas_cadastros'), where('email', '==', currentUser.email));
        return onSnapshot(q, (snap) => {
          if (!snap.empty) {
             setDriverData({ id: snap.docs[0].id, ...snap.docs[0].data() });
          }
          setLoading(false);
        });
      } else { 
        setLoading(false); 
      }
    });
    return () => unsub();
  }, []);

  // 2. GEOLOCALIZAÇÃO E PROTEÇÃO USER
  useEffect(() => {
    if (user && driverData?.status === 'aprovado' && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setDoc(doc(db, 'motoristas_online', user.uid), {
          nome: driverData.nome,
          categoria: driverData.categoria,
          lat: latitude,
          lng: longitude,
          status: 'disponivel',
          lastSeen: serverTimestamp()
        }, { merge: true });
      }, (err) => console.error("Erro de GPS:", err), { enableHighAccuracy: true });

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [driverData, user]);

  // 3. RADAR INTELIGENTE (Filtro Padronizado Anti-Erro)
  useEffect(() => {
    if (driverData?.status === 'aprovado') {
      const q = query(
        collection(db, 'fretes'), 
        where('status', '==', 'aguardando_motorista')
      );
      
      return onSnapshot(q, (snap) => {
        const fretesComDados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Padronização: Remove espaços e deixa tudo minúsculo para comparar com segurança
        const categoriaMotorista = String(driverData.categoria || '').trim().toLowerCase();
        
        const fretesFiltrados = fretesComDados.filter(f => {
           const veiculoFrete = String(f.veiculo || '').trim().toLowerCase();
           return categoriaMotorista === veiculoFrete;
        });
        
        setAvailableFretes(fretesFiltrados);
      });
    }
  }, [driverData]);

  // 4. ACEITE DE CARGA TRANSAÇÃO SEGURA (Anti Duplo-Aceite)
  const handleAccept = async (freteId: string) => {
    // Segurança: Só avança se logado e aprovado
    if (!user || driverData?.status !== 'aprovado') return;
    if (!window.confirm(`Confirmar aceite desta carga? O cliente será notificado.`)) return;
    
    // Atualização Local: Tira o frete da tela na mesma hora para o motorista não clicar duas vezes
    setAvailableFretes(prev => prev.filter(f => f.id !== freteId));
    
    try {
      const freteRef = doc(db, 'fretes', freteId);

      // Transação Atômica: Tranca o banco, checa, atualiza e sai.
      await runTransaction(db, async (transaction) => {
        const freteDoc = await transaction.get(freteRef);
        
        if (!freteDoc.exists()) {
          throw new Error("Frete não encontrado.");
        }

        if (freteDoc.data().status !== 'aguardando_motorista') {
          throw new Error("Essa carga já foi aceita por outro motorista.");
        }

        transaction.update(freteRef, {
          status: 'motorista_a_caminho', 
          motoristaId: user.uid,
          motoristaNome: driverData.nome, 
          motoristaZap: driverData.whatsapp, 
          acceptedAt: serverTimestamp()
        });
      });

      // Atualiza Status do Motorista para Ocupado (depois da transação garantir a carga)
      await setDoc(doc(db, 'motoristas_online', user.uid), {
        status: 'ocupado',
        lastSeen: serverTimestamp()
      }, { merge: true });

      alert("Carga Aceita! Contato do cliente liberado.");
    } catch (e: any) { 
      // Se der erro na transação, exibe a mensagem amigável
      alert(e.message || "Essa carga já foi aceita por outro motorista."); 
    }
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-20">
      {deferredPrompt && (
        <div className="bg-blue-600 p-3 flex items-center justify-between px-6 sticky top-0 z-[60] shadow-lg">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Baixar App FreteGO</span>
          </div>
          <button onClick={handleInstallPWA} className="bg-white text-blue-600 text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-md">Instalar</button>
        </div>
      )}

      <nav className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between shadow-2xl sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400 w-6 h-6 fill-yellow-400" />
          <span className="font-black italic text-xl uppercase tracking-tighter text-white">FRETOGO</span>
        </div>
        {driverData && (
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-400 font-bold uppercase">{driverData.categoria}</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              <span className="text-[10px] font-black uppercase text-green-400 tracking-tighter">Radar On</span>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-md mx-auto p-4">
        {!user ? (
          <div className="mt-20 text-center">
             <Truck className="w-16 h-16 text-slate-700 mx-auto mb-6" />
             <h2 className="text-2xl font-black italic uppercase mb-2">Área do Motorista</h2>
             <p className="text-slate-400 text-sm mb-8 font-medium">Faça login para entrar no radar de cargas.</p>
             <button onClick={() => signInWithPopup(auth, provider)} className="w-full bg-blue-600 p-5 rounded-2xl font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">
                ENTRAR NO RADAR
             </button>
          </div>
        ) : driverData?.status !== 'aprovado' ? (
          <div className="mt-20 text-center bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
             <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
             <h2 className="text-xl font-black italic uppercase mb-2">Conta em Análise</h2>
             <p className="text-slate-400 text-sm">Sua documentação está sendo validada pela nossa equipe estratégica.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl"><UserCheck className="w-6 h-6" /></div>
              <div>
                <p className="text-xs text-blue-400 font-bold uppercase">Bem-vindo, {driverData.nome?.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400">Seu {driverData.categoria} está ativo no radar.</p>
              </div>
            </div>

            <h2 className="text-white font-black italic text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500" /> Cargas Disponíveis ({availableFretes.length})
            </h2>
            
            {availableFretes.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed border-slate-800 rounded-[2.5rem] bg-slate-900/30">
                 <p className="text-slate-500 font-bold italic text-sm animate-pulse">Buscando fretes compatíveis...</p>
              </div>
            ) : (
              availableFretes.map((f: any) => (
                <div key={f.id} className="bg-white rounded-[2.5rem] p-6 text-slate-900 shadow-2xl border-b-[10px] border-blue-600 transition-all mb-4">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Você Recebe</p>
                      <p className="text-4xl font-black text-green-600 italic tracking-tighter">
                         R$ {f.valorMotorista ? Number(f.valorMotorista).toFixed(2).replace('.', ',') : '0,00'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <Gauge className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-[11px] font-black text-slate-800 uppercase">{f.distancia || 0} KM</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                      <Weight className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-[11px] font-black text-slate-800 uppercase">{f.peso || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="mt-1"><MapPin className="w-4 h-4 text-blue-600" /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Origem</p>
                        <p className="text-sm font-black text-slate-800">{f.cidadeOrigem}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1"><Navigation className="w-4 h-4 text-orange-500" /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Destino</p>
                        <p className="text-sm font-black text-slate-800">{f.cidadeDestino}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                       <Package className="w-4 h-4 text-slate-400" />
                       <p className="text-[10px] font-black text-slate-500 uppercase italic">Material: {f.material || 'Geral'}</p>
                    </div>
                  </div>

                  <button onClick={() => handleAccept(f.id)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl text-lg uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">
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
