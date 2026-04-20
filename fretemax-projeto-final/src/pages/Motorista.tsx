import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, UploadCloud, AlertCircle, ArrowLeft } from 'lucide-react';

const provider = new GoogleAuthProvider();

export default function Motorista() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    placa: '',
    renavam: '',
    categoria: 'Carro Pequeno'
  });

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error("Erro no login:", error);
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.placa || !form.renavam) {
        alert("Compliance: Preencha todos os dados obrigatórios do veículo.");
        return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'motoristas_cadastros'), {
        ...form,
        email: user.email,
        status: 'pendente_aprovacao',
        createdAt: serverTimestamp(),
      });
      setStep(3);
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao site
        </button>
        <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Portal do Parceiro</h1>
        <p className="text-slate-500 mb-8 text-[15px]">Acesso restrito. Faça login com o Google para iniciar seu credenciamento.</p>
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Entrar com Conta Google
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-[18px] font-bold text-slate-800 mb-1">Etapa 1: Dados Oficiais</h2>
        <div className="space-y-4 mt-4">
          <input name="nome" placeholder="Nome Completo (Igual CNH)" onChange={handleChange} className="w-full p-3 border-[1.5px] rounded-lg text-sm" />
          <input name="placa" placeholder="Placa (ABC-1234)" onChange={handleChange} className="w-full p-3 border-[1.5px] rounded-lg text-sm uppercase" />
          <input name="renavam" placeholder="Renavam" onChange={handleChange} className="w-full p-3 border-[1.5px] rounded-lg text-sm" />
          <button onClick={() => setStep(2)} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-lg mt-2">Continuar</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h2 className="text-[18px] font-bold text-slate-800 mb-4">Etapa Final: Documentação</h2>
         <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 p-6 rounded-lg text-center cursor-pointer">
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Foto da CNH</p>
                <input type="file" className="mt-2 text-sm" />
            </div>
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg">Enviar para Análise</button>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
      <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-[22px] font-bold text-slate-800 mb-2">Conta em Análise</h2>
      <p className="text-slate-600 text-[15px]">Aguarde a verificação de segurança (Prazo: 24h).</p>
    </div>
  );
}
