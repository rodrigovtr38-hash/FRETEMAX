import { useNavigate } from 'react-router-dom';
import { Package, Truck, ShieldCheck, CreditCard, MapPin } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-start h-full pb-12 animate-in fade-in zoom-in duration-500">
      
      {/* Banner de Urgência */}
      <div className="w-full max-w-4xl bg-red-600 text-white text-center py-2.5 px-4 text-[13px] sm:text-sm font-bold uppercase tracking-wider animate-pulse mb-8 rounded-lg shadow-sm border border-red-700">
        🔥 Alta demanda agora — motoristas disponíveis na sua região
      </div>

      <div className="text-center space-y-5 px-4 mb-10 w-full max-w-4xl">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-800 leading-tight tracking-tight">
          Fretes rápidos e seguros — <br className="hidden sm:block" />
          <span className="text-blue-600">de pequenas cargas até carretas de 30 toneladas</span>
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-[17px] font-medium leading-relaxed">
          Conectamos você ao motorista ideal na sua região em poucos minutos
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-4xl px-4">
        {/* Card Cliente */}
        <div className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-500 transition-all flex-1 group cursor-pointer" onClick={() => navigate('/cliente')}>
          <div className="bg-blue-50 p-5 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h3 className="text-[22px] font-bold text-slate-800">Calcular Frete</h3>
            <p className="text-[15px] leading-relaxed text-slate-500 mt-3 font-medium min-h-[60px]">
              Envie sua carga com preço fechado, segurança e agilidade — do pequeno ao pesado
            </p>
          </div>
          <button
            className="w-full mt-auto py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[16px] transition-colors shadow-md shadow-blue-200"
          >
            Pagar e Chamar Motorista
          </button>
        </div>

        {/* Card Motorista */}
        <div className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-800 transition-all flex-1 group cursor-pointer" onClick={() => navigate('/motorista')}>
          <div className="bg-slate-100 p-5 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Truck className="w-10 h-10 text-slate-800" />
          </div>
          <div>
            <h3 className="text-[22px] font-bold text-slate-800">Quero Fazer Entregas</h3>
            <p className="text-[15px] leading-relaxed text-slate-500 mt-3 font-medium min-h-[60px]">
              Ganhe dinheiro com fretes próximos a você. Vagas limitadas por cidade
            </p>
          </div>
          <button
            className="w-full mt-auto py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[16px] transition-colors shadow-md shadow-slate-200"
          >
            Cadastrar Veículo
          </button>
        </div>
      </div>

      {/* Prova Social e Confiança */}
      <div className="mt-12 bg-white flex-col sm:flex-row border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="bg-green-50 p-3 rounded-full">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <span className="font-semibold text-slate-700 text-[15px]">✔ Motoristas verificados</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-green-50 p-3 rounded-full">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <span className="font-semibold text-slate-700 text-[15px]">✔ Pagamento seguro</span>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="bg-green-50 p-3 rounded-full">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
          <span className="font-semibold text-slate-700 text-[15px]">✔ Fretes reais na sua região</span>
        </div>
      </div>

    </div>
  );
}
