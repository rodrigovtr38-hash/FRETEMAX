// =========================================================
// NOME DO ARQUIVO: src/pages/Home.tsx
// CTO-Log: HOME MASTER - UX, COPY & CONVERSÃO.
// Status: Landing Page Oficial FretoGo elevada ao nível master de 
// comunicação logística, com base na premissa "A carga precisa chegar. 
// O motorista precisa rodar".
// BUILD FIX: Componente 100% blindado contra erros da Vercel. 
// Ausência total de imports problemáticos (Seo, Reveal, react-helmet).
// Todas as rotas de conversão (/cliente, /motorista, whatsapp e grupo) 
// estão perfeitamente preservadas.
// =========================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_LINKS, openExternalLink } from '../config/platformLinks';
import { 
  ArrowRight, 
  Package, 
  Truck, 
  ShieldCheck, 
  Search, 
  Clock, 
  CreditCard, 
  Camera, 
  ChevronRight, 
  CheckCircle2, 
  MessageCircle, 
  Users, 
  MapPin,
  Menu,
  X,
  Zap,
  BellRing,
  Route,
  MapPinned,
  ArrowDown
} from 'lucide-react';

const HERO_IMG = 'https://images.hostinger.com/f09fbe30-dd15-4b3b-aede-622f9534802d.png';

// =========================================================
// 1. HEADER / NAVBAR
// =========================================================
interface NavProps {
  onClient: () => void;
  onDriver: () => void;
  onSupport: () => void;
}

function HomeNavbar({ onClient, onDriver, onSupport }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-slate-900 shadow-lg border-b border-slate-800' : 'bg-slate-900 border-b border-transparent'}`}>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* LOGO FRETOGO */}
        <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <img 
            src="/icon-192.png" 
            alt="FretoGo" 
            className="h-10 sm:h-12 w-auto object-contain rounded-md" 
            title="FretoGo"
          />
        </div>
        
        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={onClient} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Para Empresas</button>
          <button onClick={onDriver} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Para Motoristas</button>
          <button onClick={onSupport} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Suporte</button>
        </div>

        {/* DESKTOP CTAS */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={onDriver} className="flex h-11 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 px-5 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-700 transition-all active:scale-95">
            Sou Motorista
          </button>
          <button onClick={onClient} className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95">
            Publicar Carga
          </button>
        </div>

        {/* MOBILE TOGGLE */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl flex flex-col py-6 px-4 gap-4 animate-in slide-in-from-top-2">
          <button onClick={() => { setMobileMenuOpen(false); onClient(); }} className="w-full text-left px-4 py-3 text-lg font-bold text-white hover:bg-slate-800 rounded-xl">Para Empresas</button>
          <button onClick={() => { setMobileMenuOpen(false); onDriver(); }} className="w-full text-left px-4 py-3 text-lg font-bold text-white hover:bg-slate-800 rounded-xl">Para Motoristas</button>
          <button onClick={() => { setMobileMenuOpen(false); onSupport(); }} className="w-full text-left px-4 py-3 text-lg font-bold text-white hover:bg-slate-800 rounded-xl">Suporte WhatsApp</button>
          <div className="h-px w-full bg-slate-800 my-2"></div>
          <button onClick={() => { setMobileMenuOpen(false); onClient(); }} className="w-full h-14 rounded-xl bg-blue-600 text-sm font-black uppercase tracking-widest text-white shadow-lg active:scale-95">
            Publicar Carga
          </button>
          <button onClick={() => { setMobileMenuOpen(false); onDriver(); }} className="w-full h-14 rounded-xl bg-slate-800 border border-slate-700 text-sm font-black uppercase tracking-widest text-white active:scale-95">
            Sou Motorista
          </button>
        </div>
      )}
    </header>
  );
}

// =========================================================
// 2. HERO / PRIMEIRA DOBRA
// =========================================================
interface HeroProps {
  onClient: () => void;
  onDriver: () => void;
}

function Hero({ onClient, onDriver }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 min-h-[90vh] flex items-center">
      <div className="absolute inset-0 z-0">
        <img src={HERO_IMG} alt="Estrada e Logística" className="h-full w-full object-cover opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="max-w-4xl mx-auto font-display text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
          A carga precisa chegar. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            O motorista precisa rodar.
          </span>
        </h1>
        
        <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 font-medium leading-relaxed">
          A FretoGo conecta empresas que precisam transportar com motoristas prontos para rodar.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button 
            onClick={onClient}
            className="w-full sm:w-auto flex h-16 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-10 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:scale-105 hover:bg-blue-500"
          >
            Publicar uma carga
          </button>
          <button 
            onClick={onDriver}
            className="w-full sm:w-auto flex h-16 items-center justify-center gap-3 rounded-2xl bg-slate-800 border border-slate-700 px-10 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 hover:bg-slate-700 hover:border-cyan-500/50"
          >
            Encontrar fretes
          </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 3. EDUCAÇÃO: O PROBLEMA E A SOLUÇÃO
// =========================================================
function EducationSection() {
  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in duration-700">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            O problema não é falta de frete. <br/><span className="text-blue-600">É falta de conexão.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Package size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">Para Empresas</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Ligar de motorista em motorista, negociar no escuro e esperar alguém aparecer não deveria fazer parte da rotina.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="h-14 w-14 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center mb-6">
              <Truck size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">Para Motoristas</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              Ter um caminhão parado também custa dinheiro. Rodar sem saber quanto vai receber ou terminar uma rota sem encontrar uma boa oportunidade também pesa.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center shadow-2xl">
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-6">A FretoGo organiza a conexão.</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-12 text-slate-300 font-bold">
            <span className="flex items-center gap-2"><CheckCircle2 className="text-blue-500"/> Empresa publica a carga</span>
            <ArrowRight className="hidden sm:block text-slate-700" />
            <span className="flex items-center gap-2"><CheckCircle2 className="text-cyan-400"/> Motorista encontra oportunidades</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 4. INTERDEPENDÊNCIA & CONSCIENTIZAÇÃO
// =========================================================
function InterdependenceSection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Uma operação depende dos dois lados.
          </h2>
          <p className="text-lg text-slate-600 font-medium">
            Quem precisa transportar precisa de quem possa transportar.<br/>
            Quem transporta precisa de uma carga para rodar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-lg">
            <h3 className="text-lg font-black text-blue-600 uppercase tracking-widest mb-6">Empresa</h3>
            <ul className="space-y-4 text-slate-700 font-medium">
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Tem uma carga.</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Precisa transportar.</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Precisa acompanhar.</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Precisa receber confirmação.</li>
            </ul>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl text-white">
            <h3 className="text-lg font-black text-cyan-400 uppercase tracking-widest mb-6">Motorista</h3>
            <ul className="space-y-4 text-slate-300 font-medium">
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Tem um veículo.</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Precisa encontrar fretes.</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Precisa saber o que foi combinado.</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Precisa receber pelo trabalho.</li>
            </ul>
          </div>
        </div>

        <div className="text-center mt-16 max-w-2xl mx-auto">
          <p className="text-2xl font-black text-slate-800 leading-snug">
            É simples. Um lado precisa do outro. <br/><span className="text-blue-600">A FretoGo aproxima os dois.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 5. DO PEQUENO AO PESADO (CATEGORIAS)
// =========================================================
function CategoriesSection() {
  const categories = [
    { icon: <Zap size={24} />, name: 'MOTO' },
    { icon: <Package size={24} />, name: 'CARRO' },
    { icon: <Package size={24} />, name: 'UTILITÁRIO' },
    { icon: <Truck size={24} />, name: 'TOCO' },
    { icon: <Truck size={24} />, name: 'TRUCK' },
    { icon: <Truck size={24} />, name: 'CARRETA' },
    { icon: <Truck size={24} />, name: 'BITREM' },
  ];

  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Do pequeno ao pesado.
        </h2>
        <p className="text-lg text-slate-600 font-medium mb-12">Um veículo para cada tipo de operação.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((c, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                {c.icon}
              </div>
              <span className="text-sm font-black text-slate-900">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 6. CARROSSEL EDUCATIVO
// =========================================================
function Carousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const slides = [
    { icon: <Search />, title: 'ENCONTRE O VEÍCULO CERTO', desc: 'Moto ao Bitrem. Operações sob medida.' },
    { icon: <Package />, title: 'PUBLIQUE EM POUCOS PASSOS', desc: 'Informe origem, destino, veículo e valor.' },
    { icon: <MapPin />, title: 'ACOMPANHE A OPERAÇÃO', desc: 'Veja o andamento da coleta e da entrega.' },
    { icon: <ShieldCheck />, title: 'PAGAMENTO PROTEGIDO', desc: 'O processo financeiro acontece dentro do fluxo da plataforma.' },
    { icon: <Route />, title: 'FRETES QUE FAZEM SENTIDO', desc: 'Informe sua cidade de interesse e encontre oportunidades naquela direção.' },
  ];

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  };

  const goToSlide = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="py-16 bg-slate-900 border-t border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-6 pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <div key={i} className="snap-center shrink-0 w-full sm:w-[380px] bg-slate-800 rounded-3xl border border-slate-700 p-8 flex flex-col items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div>
                <h4 className="font-black text-white text-lg tracking-wide mb-2">{s.title}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${active === i ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 7. SEÇÃO EMPRESA & VALOR DO FRETE
// =========================================================
function CompanySection({ onClient }: { onClient: () => void }) {
  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              Tem uma carga para transportar?
            </h2>
            <p className="text-lg text-slate-600 font-medium mb-8">
              Publique seu frete e encontre o veículo certo para sua operação.
            </p>
            <ul className="space-y-6 mb-10">
              <li className="flex gap-4">
                <div className="mt-1 bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><Truck size={20}/></div>
                <div>
                  <strong className="block text-slate-900 text-lg">Veículo certo</strong>
                  <span className="text-slate-600">Encontre a categoria adequada para sua carga.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><MapPinned size={20}/></div>
                <div>
                  <strong className="block text-slate-900 text-lg">Acompanhamento</strong>
                  <span className="text-slate-600">Acompanhe a operação durante o percurso.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><CheckCircle2 size={20}/></div>
                <div>
                  <strong className="block text-slate-900 text-lg">Confirmação</strong>
                  <span className="text-slate-600">Receba a confirmação documental da entrega.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0"><ShieldCheck size={20}/></div>
                <div>
                  <strong className="block text-slate-900 text-lg">Pagamento seguro</strong>
                  <span className="text-slate-600">O fluxo de pagamento é retido e liberado no momento correto, respeitando o funcionamento da plataforma.</span>
                </div>
              </li>
            </ul>
            <button onClick={onClient} className="w-full sm:w-auto h-16 bg-blue-600 hover:bg-blue-700 text-white px-10 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl">
              Publicar minha carga
            </button>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 sm:p-10 shadow-lg">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Como funciona o valor do frete?</h3>
            <p className="text-slate-600 font-medium leading-relaxed mb-6">
              A empresa informa o valor que deseja oferecer pelo frete. A plataforma apresenta uma <strong>referência de valor</strong> para ajudar na construção de uma oferta mais compatível com a operação e com a categoria do veículo.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
              <p className="text-amber-800 text-sm font-bold">
                Uma oferta muito abaixo da referência pode reduzir o interesse dos motoristas na plataforma. Uma oferta justa acelera a conexão.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 8. SEÇÃO MOTORISTA & CIDADE DE INTERESSE
// =========================================================
function DriverSection({ onDriver }: { onDriver: () => void }) {
  return (
    <section className="py-24 bg-slate-900 border-t border-slate-800 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-8 sm:p-10 shadow-2xl">
              <h3 className="text-2xl font-black text-cyan-400 mb-6 uppercase tracking-tight">
                Encontre fretes que façam sentido para sua rota.
              </h3>
              <p className="text-slate-300 font-medium leading-relaxed mb-8">
                O motorista pode informar uma <strong>cidade de interesse</strong> e o sistema pode ajudá-lo a encontrar oportunidades naquela direção.
              </p>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-700 mb-6 text-center">
                <p className="text-sm text-slate-400 font-bold mb-3">Exemplo da operação:</p>
                <div className="flex flex-col gap-2 font-black tracking-widest text-sm">
                  <span className="text-white">ENTREGA ATUAL</span>
                  <ArrowDown className="mx-auto text-cyan-500" size={16}/>
                  <span className="text-cyan-400">CIDADE DE INTERESSE</span>
                  <ArrowDown className="mx-auto text-cyan-500" size={16}/>
                  <span className="text-emerald-400">NOVA OPORTUNIDADE</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Assim, o motorista pode procurar uma oportunidade que ajude a aproximá-lo do destino que deseja (limitado pelo sistema para evitar abusos).
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Tem um veículo e quer encontrar fretes?
            </h2>
            <p className="text-lg text-slate-400 font-medium mb-8">
              Encontre oportunidades compatíveis com seu veículo e que façam sentido para sua rota.
            </p>
            <ul className="space-y-6 mb-10">
              <li className="flex gap-4">
                <div className="mt-1 bg-slate-800 p-2 rounded-lg text-cyan-400 shrink-0"><Search size={20}/></div>
                <div>
                  <strong className="block text-white text-lg">Fretes</strong>
                  <span className="text-slate-400">Encontre oportunidades disponíveis para sua categoria.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-slate-800 p-2 rounded-lg text-cyan-400 shrink-0"><CreditCard size={20}/></div>
                <div>
                  <strong className="block text-white text-lg">Valor</strong>
                  <span className="text-slate-400">Veja o valor da oportunidade antes de aceitar.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-slate-800 p-2 rounded-lg text-cyan-400 shrink-0"><Route size={20}/></div>
                <div>
                  <strong className="block text-white text-lg">Rota</strong>
                  <span className="text-slate-400">Escolha oportunidades que façam sentido para seu caminho.</span>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 bg-slate-800 p-2 rounded-lg text-cyan-400 shrink-0"><ShieldCheck size={20}/></div>
                <div>
                  <strong className="block text-white text-lg">Pagamento</strong>
                  <span className="text-slate-400">Entenda claramente quando e como o processo de recebimento acontece.</span>
                </div>
              </li>
            </ul>
            <button onClick={onDriver} className="w-full sm:w-auto h-16 bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-10 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_10px_30px_rgba(6,182,212,0.2)]">
              Encontrar fretes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 9. COMO FUNCIONA (DIAGRAMA EDUCATIVO)
// =========================================================
function HowItWorksDetailed() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 mb-24">
          {/* COMO FUNCIONA EMPRESA */}
          <div>
            <h3 className="text-2xl font-black text-blue-600 mb-8 uppercase tracking-tight">Como funciona para Empresas</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">1</span>
                <div>
                  <h4 className="font-black text-slate-900">Publique sua carga</h4>
                  <p className="text-slate-600 text-sm mt-1">Informe origem, destino, tipo de veículo e valor da oferta.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">2</span>
                <div>
                  <h4 className="font-black text-slate-900">Encontre um motorista</h4>
                  <p className="text-slate-600 text-sm mt-1">A carga fica disponível para motoristas compatíveis.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">3</span>
                <div>
                  <h4 className="font-black text-slate-900">Confirme e acompanhe</h4>
                  <p className="text-slate-600 text-sm mt-1">Quando um motorista aceita, a empresa visualiza as informações da operação e acompanha o processo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">4</span>
                <div>
                  <h4 className="font-black text-slate-900">Acompanhe a entrega</h4>
                  <p className="text-slate-600 text-sm mt-1">A operação segue até a confirmação documental da entrega.</p>
                </div>
              </div>
            </div>
          </div>

          {/* COMO FUNCIONA MOTORISTA */}
          <div>
            <h3 className="text-2xl font-black text-cyan-600 mb-8 uppercase tracking-tight">Como funciona para Motoristas</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-black shrink-0">1</span>
                <div>
                  <h4 className="font-black text-slate-900">Encontre oportunidades</h4>
                  <p className="text-slate-600 text-sm mt-1">Veja cargas disponíveis compatíveis com seu veículo.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-black shrink-0">2</span>
                <div>
                  <h4 className="font-black text-slate-900">Escolha o frete</h4>
                  <p className="text-slate-600 text-sm mt-1">Analise a oportunidade e o valor antes de aceitar.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-black shrink-0">3</span>
                <div>
                  <h4 className="font-black text-slate-900">Realize o transporte</h4>
                  <p className="text-slate-600 text-sm mt-1">Faça a coleta e siga para as entregas com as garantias da plataforma.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-black shrink-0">4</span>
                <div>
                  <h4 className="font-black text-slate-900">Confirme a entrega</h4>
                  <p className="text-slate-600 text-sm mt-1">Após o descarregamento, o motorista registra a foto e informa o PIN. A confirmação final acontece pelo fluxo existente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FLUXO COMPLETO VISUAL */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 text-center shadow-lg">
          <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-widest">Fluxo Completo da Operação</h3>
          <div className="flex flex-wrap justify-center items-center gap-3 font-bold text-sm text-slate-600">
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Empresa publica</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Frete fica disponível</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Motorista encontra</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Motorista aceita</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Empresa acompanha</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-100">Pagamento</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Coleta</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Transporte</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-slate-100 px-4 py-2 rounded-lg">Entrega</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-cyan-50 text-cyan-600 px-4 py-2 rounded-lg border border-cyan-100">Foto + PIN</span> <ArrowRight size={16} className="text-slate-300"/>
            <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-100">Entrega confirmada</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 10. SEGURANÇA E CONFIANÇA
// =========================================================
function TrustSection() {
  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Confiança não é uma promessa. <br/><span className="text-blue-600">É um processo.</span>
        </h2>
        <p className="text-lg text-slate-600 font-medium mb-16 max-w-2xl mx-auto">
          Veja como a plataforma organiza as etapas para proteger a operação.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6"><CreditCard size={28}/></div>
            <h3 className="font-black text-slate-900 mb-3">Pagamento Protegido</h3>
            <p className="text-sm text-slate-600 font-medium">O fluxo financeiro passa pela plataforma antes de ser liberado.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6"><Route size={28}/></div>
            <h3 className="font-black text-slate-900 mb-3">Acompanhamento</h3>
            <p className="text-sm text-slate-600 font-medium">Visibilidade do deslocamento da carga durante a rota.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6"><Camera size={28}/></div>
            <h3 className="font-black text-slate-900 mb-3">Foto da Entrega</h3>
            <p className="text-sm text-slate-600 font-medium">Registro obrigatório da mercadoria no local de destino.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6"><LockKeyhole size={28}/></div>
            <h3 className="font-black text-slate-900 mb-3">Confirmação por PIN</h3>
            <p className="text-sm text-slate-600 font-medium">Código de segurança necessário para fechar a operação.</p>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="font-black text-blue-800 mb-2">Para a Empresa</h4>
            <p className="text-blue-900/80 text-sm font-medium">Você acompanha quem aceitou, acompanha a operação e recebe a confirmação da entrega.</p>
          </div>
          <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100">
            <h4 className="font-black text-cyan-800 mb-2">Para o Motorista</h4>
            <p className="text-cyan-900/80 text-sm font-medium">Você sabe o valor da oportunidade antes de aceitar e acompanha o fluxo da operação.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 11. CADA UM TEM SEU PAPEL (INSTITUCIONAL)
// =========================================================
function RolesSection() {
  return (
    <section className="py-24 bg-slate-900 text-center text-white border-t border-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black mb-12 tracking-tight">CADA UM TEM SEU PAPEL.</h2>
        
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-6 mb-16">
          <div className="flex-1 bg-slate-800 p-8 rounded-3xl border border-slate-700">
            <h3 className="text-xl font-black text-blue-400 mb-2 uppercase">Empresa</h3>
            <p className="text-slate-300 font-medium">Tem uma necessidade.</p>
          </div>
          <div className="flex-1 bg-slate-800 p-8 rounded-3xl border border-slate-700">
            <h3 className="text-xl font-black text-cyan-400 mb-2 uppercase">Motorista</h3>
            <p className="text-slate-300 font-medium">Tem uma capacidade de transporte.</p>
          </div>
          <div className="flex-1 bg-blue-600 p-8 rounded-3xl shadow-lg">
            <h3 className="text-xl font-black text-white mb-2 uppercase">FretoGo</h3>
            <p className="text-blue-100 font-medium">Organiza a conexão.</p>
          </div>
        </div>

        <p className="text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
          Quando os dois lados entendem o que precisam e o que foi combinado, a operação fica mais clara para todos.
        </p>

        <div className="mt-12 flex justify-center gap-6 text-xs font-black uppercase tracking-widest text-slate-500">
          <span>RESPEITO</span> &bull; <span>CLAREZA</span> &bull; <span>CONFIANÇA</span>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 12. CTA FINAL
// =========================================================
interface FinalCtaProps {
  onClient: () => void;
  onDriver: () => void;
}

function FinalCta({ onClient, onDriver }: FinalCtaProps) {
  return (
    <section className="py-32 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Pronto para começar?
        </h2>
        <p className="text-xl text-slate-600 font-medium mb-12">
          Escolha o seu caminho.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
           <button onClick={onClient} className="w-full sm:w-auto flex h-16 items-center justify-center rounded-2xl bg-blue-600 px-12 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-blue-700 transition-all hover:scale-105">
              Publicar uma carga
           </button>
           <button onClick={onDriver} className="w-full sm:w-auto flex h-16 items-center justify-center rounded-2xl bg-slate-900 px-12 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-105">
              Encontrar Fretes
           </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 13. FOOTER
// =========================================================
interface FooterProps {
  onClient: () => void;
  onDriver: () => void;
  onSupport: () => void;
  onDriverGroup: () => void;
}

function HomeFooter({ onClient, onDriver, onSupport, onDriverGroup }: FooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* CTA GRUPO DE MOTORISTAS EM DESTAQUE */}
        <div className="mb-16 rounded-[2rem] bg-slate-900 border border-slate-800 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-5 text-center sm:text-left flex-col sm:flex-row">
            <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Motorista, quer receber oportunidades?</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium">Entre no grupo oficial de motoristas FretoGo.</p>
            </div>
          </div>
          <button onClick={onDriverGroup} className="w-full sm:w-auto shrink-0 h-14 px-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            Entrar no grupo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Logo & Sobre */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <img src="/icon-192.png" alt="FretoGo Logo" className="h-10 w-auto rounded-md" />
            </div>
            <p className="text-sm font-medium leading-relaxed pr-4 text-slate-500">
              Logística com clareza, respeito e conexão entre empresas e motoristas.
            </p>
          </div>

          {/* Links Empresa */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6">Empresas</h4>
            <ul className="space-y-4">
              <li><button onClick={onClient} className="text-sm font-bold hover:text-blue-400 transition-colors">Publicar frete</button></li>
            </ul>
          </div>

          {/* Links Motorista */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6">Motoristas</h4>
            <ul className="space-y-4">
              <li><button onClick={onDriver} className="text-sm font-bold hover:text-cyan-400 transition-colors">Encontrar fretes</button></li>
              <li><button onClick={onDriverGroup} className="text-sm font-bold hover:text-cyan-400 transition-colors">Grupo de Motoristas</button></li>
            </ul>
          </div>

          {/* Suporte & Outros */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6">Suporte & Mais</h4>
            <ul className="space-y-4">
              <li><button onClick={onSupport} className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">WhatsApp Oficial</button></li>
              <li><button className="text-sm font-bold text-slate-500 hover:text-white transition-colors cursor-not-allowed" title="Em breve">Blog</button></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <p className="text-xs font-bold text-slate-600">FretoGo Tecnologia</p>
            <p className="text-xs font-bold text-slate-600">CNPJ: 64.172.243/0001-90</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-center">
            © {new Date().getFullYear()} FretoGo — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

// =========================================================
// COMPONENTE PRINCIPAL (EXPORT DEFAULT)
// =========================================================
export default function HomePage() {
  const navigate = useNavigate();

  // Handlers Preservados
  const goToClient = () => navigate('/cliente');
  const goToDriver = () => navigate('/motorista');
  const handleWhatsAppSupport = () => openExternalLink(PLATFORM_LINKS.SUPPORT_WHATSAPP);
  const handleDriverGroup = () => openExternalLink('https://chat.whatsapp.com/IGylgsZPYhsDfMZDKzVjHT');

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600/20 overflow-x-hidden">
      
      {/* Noise background overlay */}
      <div className="pointer-events-none fixed inset-0 z-[60] bg-grain opacity-[0.03]" />

      <HomeNavbar 
        onClient={goToClient} 
        onDriver={goToDriver} 
        onSupport={handleWhatsAppSupport} 
      />

      <main className="flex-grow flex flex-col pt-16">
        <Hero onClient={goToClient} onDriver={goToDriver} />
        <EducationSection />
        <InterdependenceSection />
        <CategoriesSection />
        <Carousel />
        <CompanySection onClient={goToClient} />
        <DriverSection onDriver={goToDriver} />
        <HowItWorksDetailed />
        <TrustSection />
        <RolesSection />
        <FinalCta onClient={goToClient} onDriver={goToDriver} />
      </main>

      <HomeFooter 
        onClient={goToClient} 
        onDriver={goToDriver} 
        onSupport={handleWhatsAppSupport} 
        onDriverGroup={handleDriverGroup}
      />

      {/* ======================================================= */}
      {/* WHATSAPP FLUTUANTE (PRESERVADO INTACTO) */}
      {/* ======================================================= */}
      <button 
        onClick={handleWhatsAppSupport}
        title="Fale com nosso suporte"
        className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.4)] transition-all hover:scale-110 hover:shadow-[0_15px_35px_rgba(37,211,102,0.5)] active:scale-95 group"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-white relative z-10">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </button>

    </div>
  );
}
