import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, ShieldCheck, CreditCard, MapPin, Zap } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  // CTO LOGIC: Bloqueio de tráfego recorrente. Se já entrou antes, pula a Landing Page.
  useEffect(() => {
    const jaEntrou = localStorage.getItem('usuario_entrou');
    if (jaEntrou === 'true') {
      navigate('/cliente');
    }
  }, [navigate]);

  const handleSimularFrete = () => {
    // Grava no navegador que o cliente já passou pelo funil de conversão
    localStorage.setItem('usuario_entrou', 'true');
    navigate('/cliente');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-slate-50 pb-12 animate-in fade-in zoom-in duration-500 font-sans">
      
      {/* Banner de Urgência - Foco em Conversão e Escala */}
      <div className="w-full bg-red-600 text-white text-center py-3 px-4 text-[13px] sm:text-sm font-black uppercase tracking-widest shadow-md">
        🔥 Alta demanda agora — Motoristas disponíveis na sua região
      </div>

      <div className="text-center space-y-6 px-4 mt-12 mb-12 w-full max-w-4xl">
        <div className="flex justify-center mb-4">
           <Zap className="text-yellow-500 w-12 h-12 fill-yellow-500" />
        </div>
        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight tracking-tighter uppercase italic">
          Frete em minutos com <br className="hidden sm:block" />
          <span className="text-blue-600">motoristas próximos a você</span>
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg sm:text-xl font-bold leading-relaxed">
          Segurança, preço fechado e coleta imediata. Do pequeno pacote à carreta pesada.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {/* Card Cliente - O Funil Principal */}
        <div 
          className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl hover:shadow-2xl hover:border-blue-600 transition-all flex-1 group cursor-pointer relative overflow-hidden" 
          onClick={handleSimularFrete}
        >
          <div className="absolute top-0 w-full h-2 bg-blue-600 left-0"></div>
          <div className="bg-blue-600 p-6 rounded-full group-hover:scale-110 transition-transform duration-300 mt-2 shadow-lg shadow-blue-200">
            <Package className="w-12 h-12 text-white" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Simular Frete Agora</h3>
            <p className="text-base leading-relaxed text-slate-500 mt-3 font-bold min-h-[60px]">
              Descubra o valor na hora e veja os motoristas disponíveis na sua região.
            </p>
          </div>
          <button className="w-full mt-auto py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-lg transition-colors shadow-lg active:scale-95 uppercase italic tracking-wider">
            FAZER COTAÇÃO
          </button>
        </div>

        {/* Card Motorista */}
        <div 
          className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-xl hover:shadow-2xl hover:border-slate-900 transition-all flex-1 group cursor-pointer relative overflow-hidden" 
          onClick={() => navigate('/motorista')}
        >
           <div className="absolute top-0 w-full h-2 bg-slate-900 left-0"></div>
          <div className="bg-slate-900 p-6 rounded-full group-hover:scale-110 transition-transform duration-300 mt-2 shadow-lg shadow-slate-200">
            <Truck className="w-12 h-12 text-white" />
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Sou Motorista</h3>
            <p className="text-base leading-relaxed text-slate-500 mt-3 font-bold min-h-[60px]">
              Receba notificações de fretes próximos a você e aumente sua renda.
            </p>
          </div>
          <button className="w-full mt-auto py-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-lg transition-colors shadow-lg active:scale-95 uppercase italic tracking-wider">
            CADASTRAR VEÍCULO
          </button>
        </div>
      </div>

      {/* Prova Social e Confiança - Gatilhos Mentais */}
      <div className="mt-16 bg-white flex-col sm:flex-row border border-slate-200 rounded-[2rem] p-6 sm:p-8 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center items-center justify-center shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-green-100 p-4 rounded-full">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <span className="font-black text-slate-800 text-sm uppercase tracking-wide">Motoristas<br/>Verificados</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-blue-100 p-4 rounded-full">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
