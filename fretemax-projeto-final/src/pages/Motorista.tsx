import { useState } from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, UploadCloud, AlertCircle, ArrowLeft } from 'lucide-react';

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
      // Salvando os dados de texto. As fotos virão na V2 com o Firebase Storage.
      await addDoc(collection(db, 'motoristas_cadastros'), {
        ...form,
        email: user.email,
        status: 'pendente_aprovacao',
        createdAt: serverTimestamp(),
      });
      setStep(3);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TELA 0: LOGIN INICIAL
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar ao site
        </button>
        <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Portal do Parceiro</h1>
        <p className="text-slate-500 mb-8 text-[15px]">Acesso restrito. Faça login com o Google para iniciar seu credenciamento de segurança.</p>
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Entrar com Conta Google
        </button>
      </div>
    );
  }

  // ETAPA 1: DADOS DO VEÍCULO
  if (step === 1) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-[18px] font-bold text-slate-800 mb-1">Etapa 1: Dados Oficiais</h2>
        <p className="text-sm text-slate-500 mb-5">Preencha os dados exatos do documento.</p>
        <div className="space-y-4">
          <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase">Nome Completo</label>
              <input name="nome" placeholder="Igual à CNH" onChange={handleChange} className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:outline-none" />
          </div>
          <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase">WhatsApp</label>
              <input name="whatsapp" placeholder="(00) 00000-0000" onChange={handleChange} className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
              <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase">Placa</label>
                  <input name="placa" placeholder="ABC-1234" onChange={handleChange} className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg uppercase text-sm focus:border-blue-600 focus:outline-none" />
              </div>
              <div>
                  <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase">RENAVAM</label>
                  <input name="renavam" placeholder="0000000000" onChange={handleChange} className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-sm focus:border-blue-600 focus:outline-none" />
              </div>
          </div>
          <div>
              <label className="block text-[12px] font-bold text-slate-500 mb-1 uppercase">Categoria do Veículo</label>
              <select name="categoria" onChange={handleChange} className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg bg-white text-sm focus:border-blue-600 focus:outline-none">
                <option value="Carro Pequeno">Carro Pequeno</option>
                <option value="Utilitário">Utilitário (Fiorino, Kangoo)</option>
                <option value="Caminhão 3/4">Caminhão 3/4</option>
                <option value="Carreta">Carreta (Até 30 Toneladas)</option>
              </select>
          </div>
          <button onClick={() => setStep(2)} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-lg mt-2 hover:bg-slate-900 transition-colors">
              Continuar para Documentos
          </button>
        </div>
      </div>
    );
  }

  // ETAPA 2: UPLOAD DE DOCUMENTOS
  if (step === 2) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h2 className="text-[18px] font-bold text-slate-800 mb-1">Etapa Final: Documentação</h2>
         <p className="text-sm text-slate-500 mb-5">Envie fotos legíveis para a análise de segurança.</p>
         <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 p-6 rounded-lg text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-[15px] font-bold text-slate-700">Foto da CNH</p>
                <p className="text-[12px] text-slate-500 mb-3">Tire do documento fora do plástico</p>
                <input type="file" className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="border-2 border-dashed border-slate-300 p-6 rounded-lg text-center cursor-pointer hover:bg-slate-50 transition-colors">
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-[15px] font-bold text-slate-700">Documento do Carro (CRLV)</p>
                <p className="text-[12px] text-slate-500 mb-3">Pode ser o documento digital (PDF/Print)</p>
                <input type="file" className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg hover:bg-green-700 transition-colors mt-4">
                {isSubmitting ? 'Criptografando dados...' : 'Enviar para Análise de Segurança'}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-slate-500 text-sm font-medium hover:text-slate-700 py-2">
                Voltar e corrigir dados
            </button>
         </div>
      </div>
    );
  }

  // TELA FINAL: COMPLIANCE
  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center animate-in fade-in zoom-in duration-300">
      <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-[22px] font-bold text-slate-800 mb-2">Conta em Análise</h2>
      <p className="text-slate-600 text-[15px] leading-relaxed">
        Seus documentos foram recebidos pelo nosso sistema e estão passando pelo rigoroso processo de Background Check (Verificação de Antecedentes).
      </p>
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-slate-800 text-[14px] font-bold uppercase tracking-wide">Prazo de liberação</p>
          <p className="text-blue-600 font-black text-xl mt-1">Até 24 horas</p>
      </div>
      <p className="text-slate-400 mt-6 text-[13px]">Você será notificado via WhatsApp assim que sua conta for ativada para receber fretes.</p>
    </div>
  );
}
