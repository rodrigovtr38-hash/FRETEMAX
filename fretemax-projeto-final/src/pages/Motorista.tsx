import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, UploadCloud, AlertCircle, ArrowLeft, Loader2, CheckCircle2, Map as MapIcon } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [driverData, setDriverData] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nome: '', whatsapp: '', placa: '', renavam: '', categoria: 'Carro Pequeno' });

  // ESCUTA EM TEMPO REAL: Se você mudar o status no Firebase, a tela dele muda na hora!
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, 'motoristas_cadastros'), where('email', '==', user.email));
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            setDriverData(snapshot.docs[0].data());
          }
          setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, provider); } catch (error) { console.error(error); }
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.placa || !form.renavam) { alert("Preencha tudo."); return; }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'motoristas_cadastros'), {
        ...form,
        email: user.email,
        status: 'pendente_aprovacao',
        createdAt: serverTimestamp(),
      });
    } catch (error) { alert("Erro ao salvar."); }
    setIsSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;

  // 1. TELA DE LOGIN
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Portal do Parceiro</h1>
        <button onClick={handleLogin} className="w-full mt-6 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700">Entrar com Google</button>
      </div>
    );
  }

  // 2. LOGICA DE NAVEGAÇÃO POR STATUS (O CORAÇÃO DO APP)
  
  // SE NÃO TEM CADASTRO -> MOSTRA FORMULÁRIO
  if (!driverData) {
    if (step === 1) return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl border">
        <h2 className="text-xl font-bold">Cadastro de Motorista</h2>
        <div className="space-y-4 mt-6">
          <input placeholder="Nome Completo" onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input placeholder="WhatsApp (DDD)" onChange={e => setForm({...form, whatsapp: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input placeholder="Placa" onChange={e => setForm({...form, placa: e.target.value})} className="w-full p-3 border rounded-lg uppercase" />
          <input placeholder="Renavam" onChange={e => setForm({...form, renavam: e.target.value})} className="w-full p-3 border rounded-lg" />
          <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl">Próximo</button>
        </div>
      </div>
    );
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl border text-center">
        <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Documentação</h2>
        <input type="file" className="mt-6 mb-6" />
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl">{isSubmitting ? 'Enviando...' : 'Finalizar'}</button>
      </div>
    );
  }

  // SE STATUS === PENDENTE
  if (driverData.status === 'pendente_aprovacao') {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl border text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Conta em Análise</h2>
        <p className="text-slate-600 mt-2">Nossa equipe verificará seus dados em até 24h.</p>
        <button onClick={() => window.location.href = '/'} className="mt-8 text-blue-600 font-bold">Voltar ao site</button>
      </div>
    );
  }

  // SE STATUS === APROVADO -> RADAR EM TEMPO REAL!
  if (driverData.status === 'aprovado') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold flex items-center gap-2"><MapIcon className="text-green-400" /> Radar de Fretes</h1>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">ONLINE</span>
          </div>
          
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center">
            <p className="text-slate-400">Buscando cargas para {driverData.categoria}...</p>
            <Loader2 className="animate-spin mx-auto mt-6 text-blue-500" />
            <p className="text-xs text-slate-500 mt-8 uppercase tracking-widest">Aguardando novo frete na região</p>
          </div>
        </div>
      </div>
    );
  }

  return <div>Erro no sistema. Contate o suporte.</div>;
}
