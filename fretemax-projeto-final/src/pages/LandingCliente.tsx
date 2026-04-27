import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Zap, ChevronRight } from 'lucide-react';

export default function LandingCliente() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="p-6 border-b border-slate-100 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-black italic text-2xl text-slate-950">
          <Zap className="text-yellow-400 fill-yellow-400" /> FRETOGO
        </div>
        <Link to="/cliente" className="bg-slate-950 text-white px-6 py-2 rounded-full font-bold text-sm">Entrar</Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* ESQUERDA: COPY MATADORA */}
        <div>
          <h1 className="text-5xl md:text-6xl font-black leading-[1.1] mb-6 text-slate-950">
            Contrate um frete em <span className="text-blue-600">segundos</span> com segurança total.
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            O radar inteligente do Fretogo localiza o motorista mais próximo de você agora. 
            Preço justo, rastreio em tempo real e zero burocracia.
          </p>
          <Link to="/cliente" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase italic shadow-xl shadow-blue-200 transition-all active:scale-95">
            Simular Frete Agora <ChevronRight />
          </Link>
          
          <div className="mt-12 flex gap-8 items-center border-t border-slate-100 pt-8">
            <div className="flex items-center gap-2"><ShieldCheck className="text-green-500 w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verificados</span></div>
            <div className="flex items-center gap-2"><MapPin className="text-blue-500 w-5 h-5"/> <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rastreio Vivo</span></div>
          </div>
        </div>

        {/* DIREITA: IMAGEM/ILUSTRAÇÃO LEVE */}
        <div className="relative flex justify-center">
            <div className="w-full max-w-[450px] aspect-square bg-blue-50 rounded-[3rem] flex items-center justify-center p-8 border-2 border-blue-100">
               <div className="bg-white w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col items-center justify-center p-6 text-center">
                  <MapPin className="w-16 h-16 text-blue-600 mb-4 animate-bounce" />
                  <p className="font-black text-xl italic uppercase">Radar Fretogo</p>
                  <p className="text-slate-400 text-sm">Escaneando motoristas ativos em sua região...</p>
               </div>
            </div>
        </div>
      </main>
    </div>
  );
}
