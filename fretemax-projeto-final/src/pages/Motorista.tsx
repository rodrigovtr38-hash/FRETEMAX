import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ShieldCheck, UploadCloud, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [form, setForm] = useState({ nome: '', whatsapp: '', placa: '', renavam: '', categoria: 'Carro Pequeno' });

  // CHECAGEM DE PERSISTÊNCIA (Lembrar do motorista)
  useEffect(() => {
    const checkRegistration = async (email: string) => {
      setCheckingStatus(true);
      try {
        const q = query(collection(db, 'motoristas_cadastros'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) { setStep(3); } // Pula direto para a tela de análise
      } catch (e) { console.error(e); }
      setCheckingStatus(false);
    };

    auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        checkRegistration(user.email!);
      }
    });
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.placa || !form.renavam) { alert("Preencha os dados do veículo."); return; }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'motoristas_cadastros'), {
        ...form,
        email: user.email,
        status: 'pendente_aprovacao',
        createdAt: serverTimestamp(),
      });
      setStep(3);
    } catch (error) { alert("Erro ao salvar."); }
    setIsSubmitting(false);
  };

  // BOTÃO VOLTAR NO TOPO (UX)
  const Header = () => (
    <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Início
    </button>
  );

  if (checkingStatus) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <Header />
        <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Portal do Parceiro</h1>
        <p className="text-slate-500 mb-8 mt-2">Acesso restrito a motoristas verificados.</p>
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors">Entrar com Google</button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <Header />
        <h2 className="text-xl font-bold text-slate-800">Dados do Veículo</h2>
        <div className="space-y-4 mt-6">
          <input placeholder="Nome Completo" onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 border rounded-lg" />
          <input placeholder="WhatsApp (DDD)" onChange={e => setForm({...form, whatsapp: e.target.value})} className="w-full p-3 border rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Placa" onChange={e => setForm({...form, placa: e.target.value})} className="w-full p-3 border rounded-lg uppercase" />
            <input placeholder="Renavam" onChange={e => setForm({...form, renavam: e.target.value})} className="w-full p-3 border rounded-lg" />
          </div>
          <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl">Próximo Passo</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
         <Header />
         <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-4" />
         <h2 className="text-xl font-bold text-slate-800">Fotos dos Documentos</h2>
         <p className="text-sm text-slate-500 mb-6 mt-2">CNH e Documento do Veículo (CRLV)</p>
         <div className="border-2 border-dashed border-slate-200 p-8 rounded-xl bg-slate-50 mb-6">
            <input type="file" className="text-sm cursor-pointer" />
         </div>
         <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl">{isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center animate-in fade-in zoom-in">
      <Header />
      <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-slate-800">Conta em Análise</h2>
      <p className="text-slate-600 mt-2 leading-relaxed">Olá {user.displayName || 'Parceiro'}, recebemos seus dados. Nossa equipe verificará as informações em até 24h.</p>
      <div className="mt-8 p-4 bg-slate-50 rounded-lg text-xs text-slate-400">ID de Segurança: {user.uid.substring(0,8)}</div>
    </div>
  );
}
