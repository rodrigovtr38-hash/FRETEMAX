import { Link } from 'react-router-dom';
import { Truck, Zap, ShieldCheck, DollarSign, ChevronRight } from 'lucide-react';

export default function LandingMotorista() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-black italic text-2xl">
          <Zap className="text-yellow-400 fill-yellow-400" /> FRETOGO
        </div>
        <Link to="/motorista" className="text-slate-400 font-bold hover:text-white">Já sou cadastrado</Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* ESQUERDA: COPY DE GANHO */}
        <div>
          <div className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-6">
            Oportunidade de Ganho Real
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-[1.1] mb-6">
            Ganhe dinheiro com seu veículo <span className="text-yellow-400 italic underline">sem mensalidade</span>.
          </h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed">
            Receba fretes pagos direto no seu celular. Você fica com 80% do valor e não paga nada por mês para usar a plataforma. 
          </p>
          <Link to="/motorista" className="inline-flex items-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-10 py-5 rounded-2xl font-black uppercase italic shadow-xl shadow-yellow-400/20 transition-all active:scale-95">
            Cadastrar meu Veículo <ChevronRight />
          </Link>
          
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-slate-900 pt-8">
            <div className="flex items-center gap-3"><DollarSign className="text-green-500"/> <span className="text-xs font-bold uppercase text-slate-500">Pagamento em 24h</span></div>
            <div className="flex items-center gap-3"><Truck className="text-blue-400"/> <span className="text-xs font-bold uppercase text-slate-500">Cargas na Região</span></div>
          </div>
        </div>

        {/* DIREITA: VISUAL IMPACTO */}
        <div className="relative">
           <div className="w-full max-w-[450px] aspect-video bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col p-8 justify-center overflow-hidden">
              <div className="flex items-center gap-4 mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700 animate-pulse">
                 <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center font-black italic text-slate-950">R$</div>
                 <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Novo Frete Disponível</p>
                    <p className="text-lg font-black italic">R$ 180,00 - 3.2km</p>
                 </div>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                 <div className="bg-yellow-400 h-full w-2/3"></div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
