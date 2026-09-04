// =========================================================
// NOME DO ARQUIVO: src/pages/Home.tsx
// CTO-Log: HOME-2.0. Refatoração controlada da jornada comercial.
// Status: Home deixa de enviar o visitante direto para as rotas
// operacionais (/cliente, /motorista) ao clicar nos botões principais.
// Agora a Home conduz o visitante por uma jornada dentro da própria
// página — Hero > Escolha de Perfil > Categorias > Página específica
// por perfil (educação + benefícios) > Precificação > Confiança > CTA
// final — e só então a navegação real acontece, nas seções profundas
// de cada perfil (#empresa e #motorista) e no CTA final.
//
// IMPORTANTE (ver relatório entregue junto com este arquivo):
// Não foi criada nenhuma rota nova. App.tsx / o arquivo de rotas do
// projeto não foi fornecido, então não há visibilidade sobre rotas já
// existentes (ex.: possíveis páginas de marketing /empresas ou
// /motoristas). Criar rotas às cegas violaria a regra explícita de não
// duplicar rotas equivalentes. A jornada "página específica + educação"
// foi implementada como seções ancoradas dentro da própria Home
// (scroll suave até #empresa / #motorista), preservando 100% das rotas
// reais existentes (/cliente e /motorista) para o CTA final de cada
// perfil.
//
// Todas as rotas, o link do WhatsApp e o link do grupo de motoristas
// (ambos hardcoded como já estavam) foram preservados sem alteração.
// Nenhum cálculo de preço foi alterado — a seção de precificação é
// apenas texto explicativo.
// HOME-FIX-04 (mantido): import de LockKeyhole corrigido.
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
  LockKeyhole
} from 'lucide-react';

const HERO_IMG = 'https://images.hostinger.com/f09fbe30-dd15-4b3b-aede-622f9534802d.png';

// Rolagem suave utilitária — usada pelos pontos de entrada (navbar, hero,
// escolha de perfil) para levar o visitante até a página específica do
// seu perfil, em vez de navegar direto para o cadastro.
function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =========================================================
// 1. HEADER / NAVBAR ESPECÍFICO DA HOME
// =========================================================
interface NavProps {
  onGoEmpresa: () => void;
  onGoMotorista: () => void;
  onSupport: () => void;
}

function HomeNavbar({ onGoEmpresa, onGoMotorista, onSupport }: NavProps) {
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

        {/* LOGO FRETOGO INTEGRADA */}
        <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <img
            src="/icon-192.png"
            alt="FretoGo Logo"
            className="h-10 sm:h-12 w-auto object-contain rounded-md"
            title="FretoGo"
          />
        </div>

        {/* NAVEGAÇÃO DESKTOP */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={onGoEmpresa} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Para Empresas</button>
          <button onClick={onGoMotorista} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Para Motoristas</button>
          <button onClick={onSupport} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Suporte</button>
        </div>

        {/* CTAs DESKTOP */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={onGoMotorista} className="flex h-11 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 px-5 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-700 transition-all active:scale-95">
            Sou Motorista
          </button>
          <button onClick={onGoEmpresa} className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95">
            Publicar Carga
          </button>
        </div>

        {/* MENU MOBILE TOGGLE */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MENU MOBILE EXPANDIDO */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl flex flex-col py-6 px-4 gap-4 animate-in slide-in-from-top-2">
          <button onClick={() => { setMobileMenuOpen(false); onGoEmpresa(); }} className="w-full text-left px-4 py-3 text-lg font-bold text-white hover:bg-slate-800 rounded-xl">Para Empresas</button>
          <button onClick={() => { setMobileMenuOpen(false); onGoMotorista(); }} className="w-full text-left px-4 py-3 text-lg font-bold text-white hover:bg-slate-800 rounded-xl">Para Motoristas</button>
          <button onClick={() => { setMobileMenuOpen(false); onSupport(); }} className="w-full text-left px-4 py-3 text-lg font-bold text-white hover:bg-slate-800 rounded-xl">Suporte WhatsApp</button>
          <div className="h-px w-full bg-slate-800 my-2"></div>
          <button onClick={() => { setMobileMenuOpen(false); onGoEmpresa(); }} className="w-full h-14 rounded-xl bg-blue-600 text-sm font-black uppercase tracking-widest text-white shadow-lg active:scale-95">
            Publicar Carga
          </button>
          <button onClick={() => { setMobileMenuOpen(false); onGoMotorista(); }} className="w-full h-14 rounded-xl bg-slate-800 border border-slate-700 text-sm font-black uppercase tracking-widest text-white active:scale-95">
            Sou Motorista
          </button>
        </div>
      )}
    </header>
  );
}

// =========================================================
// 2. HERO / BANNER PRINCIPAL
// =========================================================
interface HeroProps {
  onGoEmpresa: () => void;
  onGoMotorista: () => void;
}

function Hero({ onGoEmpresa, onGoMotorista }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 min-h-[85vh] flex items-center">
      <div className="absolute inset-0 z-0">
        <img src={HERO_IMG} alt="Rodovia Logística" className="h-full w-full object-cover opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900"></div>
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
          Carga e veículo, conectados de forma inteligente
        </span>

        <h1 className="max-w-3xl mx-auto font-display text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
          Seu frete <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">começa aqui.</span>
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-lg sm:text-xl text-slate-300 font-medium leading-relaxed">
          A FretoGo conecta empresas que precisam transportar com motoristas e veículos disponíveis, de forma direta e segura.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button
            onClick={onGoEmpresa}
            className="w-full sm:w-auto flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 px-10 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:bg-blue-500"
          >
            Publicar Carga <ArrowRight size={18} />
          </button>
          <button
            onClick={onGoMotorista}
            className="w-full sm:w-auto flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-slate-800 border border-slate-700 px-10 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 hover:bg-slate-700 hover:border-cyan-500/50"
          >
            <Truck size={18} className="text-cyan-400" /> Encontrar Fretes
          </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 3. CARROSSEL (BANNER SECUNDÁRIO)
// =========================================================
function Carousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const slides = [
    { icon: <Search size={22} />, title: 'Encontre o veículo certo', desc: 'Cada operação tem uma categoria ideal — do moto-frete ao bitrem.' },
    { icon: <MapPin size={22} />, title: 'Oportunidades por região', desc: 'Motoristas acompanham novas cargas conforme sua área de interesse.' },
    { icon: <ShieldCheck size={22} />, title: 'Pagamento protegido', desc: 'O valor combinado fica retido até a confirmação da entrega.' },
    { icon: <MessageCircle size={22} />, title: 'Novidades da plataforma', desc: 'A FretoGo está em expansão contínua de categorias e regiões.' },
  ];

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    const index = Math.round(el.scrollLeft / slideWidth);
    setActive(index);
  };

  const goToSlide = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="py-14 bg-slate-50 border-t border-b border-slate-200">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-full sm:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                {s.icon}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">{s.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Ir para o slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${active === i ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 4. ESCOLHA DE PERFIL
// =========================================================
interface AudienceChoiceProps {
  onGoEmpresa: () => void;
  onGoMotorista: () => void;
}

function AudienceChoice({ onGoEmpresa, onGoMotorista }: AudienceChoiceProps) {
  return (
    <section id="escolha" className="py-24 bg-white relative z-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Qual é o seu perfil?</h2>
          <p className="mt-4 text-lg text-slate-600 font-medium">Escolha seu caminho e entenda como a FretoGo funciona para você.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* CARD EMPRESA */}
          <div className="bg-slate-50 rounded-[2rem] p-8 sm:p-10 shadow-lg border border-slate-200 flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 border border-blue-100">
              <Package size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Tem uma carga para transportar?</h3>
            <p className="text-slate-600 mb-8 flex-grow text-base leading-relaxed">
              Publique sua carga, encontre o veículo adequado e acompanhe a operação do início ao fim.
            </p>
            <button onClick={onGoEmpresa} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-2">
              Publicar minha carga <ChevronRight size={18} />
            </button>
          </div>

          {/* CARD MOTORISTA */}
          <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl border border-slate-800 flex flex-col h-full text-white transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="h-16 w-16 bg-slate-800 text-cyan-400 rounded-2xl flex items-center justify-center mb-8 border border-slate-700">
              <Truck size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Tem um veículo e quer encontrar fretes?</h3>
            <p className="text-slate-400 mb-8 flex-grow text-base leading-relaxed">
              Encontre oportunidades, escolha as que fazem sentido para sua rota e trabalhe com mais liberdade.
            </p>
            <button onClick={onGoMotorista} className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2">
              Encontrar fretes <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

// =========================================================
// 5. CATEGORIAS DE VEÍCULOS
// =========================================================
function CategoriesSection() {
  const categories = [
    { icon: <Zap size={26} />, name: 'Moto' },
    { icon: <Package size={26} />, name: 'Carro' },
    { icon: <Package size={26} />, name: 'Utilitário' },
    { icon: <Truck size={26} />, name: 'Toco' },
    { icon: <Truck size={26} />, name: 'Truck' },
    { icon: <Truck size={26} />, name: 'Carreta' },
    { icon: <Truck size={26} />, name: 'Bitrem' },
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            Em expansão
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Um veículo para cada operação</h2>
          <p className="mt-4 text-lg text-slate-600 font-medium">
            A FretoGo atende diferentes tipos de carga e está expandindo continuamente por categorias e regiões.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
// 6. PÁGINA ESPECÍFICA — EMPRESA (educação + benefícios + CTA real)
// =========================================================
interface PersonaProps {
  onConfirm: () => void;
}

function PersonaEmpresa({ onConfirm }: PersonaProps) {
  const steps = [
    { title: 'Publicação da Carga', desc: 'Insira a origem, destino, tipo de veículo e valor da oferta.' },
    { title: 'Pagamento Seguro', desc: 'Ao encontrar um motorista, o pagamento é feito para liberar a rota.' },
    { title: 'Acompanhamento', desc: 'Monitore o status do deslocamento e da coleta em tempo real.' },
    { title: 'Confirmação (PIN e Foto)', desc: 'Receba a foto da mercadoria e forneça o PIN para validar a entrega.' },
  ];

  const benefits = [
    { icon: <Package size={22} />, label: 'Publicação de frete' },
    { icon: <CheckCircle2 size={22} />, label: 'Escolha da categoria' },
    { icon: <Zap size={22} />, label: 'Frete imediato' },
    { icon: <Clock size={22} />, label: 'Frete agendado' },
    { icon: <Truck size={22} />, label: 'Até 5 entregas por publicação' },
    { icon: <MapPin size={22} />, label: 'Acompanhamento da operação' },
    { icon: <LockKeyhole size={22} />, label: 'Confirmação por PIN' },
    { icon: <Camera size={22} />, label: 'Foto da entrega' },
    { icon: <CreditCard size={22} />, label: 'Pagamento protegido' },
  ];

  return (
    <section id="empresa" className="py-24 bg-white border-t border-slate-200 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
              Para Empresas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Publique sua carga. <br /> Encontre o veículo certo.
            </h2>
            <p className="mt-6 text-lg text-slate-600 font-medium leading-relaxed">
              Pare de perder tempo buscando veículos. Publique sua carga, acompanhe a operação em tempo real e tenha a garantia da mercadoria validada na entrega.
            </p>
          </div>
          <div className="relative">
            <img src={HERO_IMG} alt="Operação de logística para empresas" className="w-full h-72 object-cover rounded-[2rem] shadow-xl" />
          </div>
        </div>

        {/* COMO FUNCIONA */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((s, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm mb-4">{i + 1}</div>
              <h4 className="font-bold text-slate-900 mb-1">{s.title}</h4>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* BENEFÍCIOS */}
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-blue-600 shrink-0">{b.icon}</span>
              <span className="text-sm font-bold text-slate-800">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={onConfirm} className="inline-flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 px-12 text-sm font-black uppercase tracking-widest text-white shadow-xl hover:bg-blue-700 transition-all hover:scale-105">
            Publicar minha carga <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 7. PÁGINA ESPECÍFICA — MOTORISTA (educação + benefícios + CTA real)
// =========================================================
function PersonaMotorista({ onConfirm }: PersonaProps) {
  const steps = [
    { title: 'Radar de Oportunidades', desc: 'Acesse o mural e encontre cargas disponíveis na sua região.' },
    { title: 'Aceite o Frete', desc: 'Confirme o interesse e aguarde a liberação do pagamento pelo cliente.' },
    { title: 'Realize o Transporte', desc: 'Desloque-se até a coleta e inicie a rota com segurança financeira.' },
    { title: 'Entrega e Repasse', desc: 'Tire a foto, insira o PIN do cliente e receba o valor na sua conta.' },
  ];

  const benefits = [
    { icon: <Search size={22} />, label: 'Radar de oportunidades' },
    { icon: <CheckCircle2 size={22} />, label: 'Escolha das oportunidades' },
    { icon: <ArrowRight size={22} />, label: 'Liberdade para escolher rotas' },
    { icon: <Truck size={22} />, label: 'Categorias diferentes' },
    { icon: <MapPin size={22} />, label: 'Filtro por cidade de interesse' },
    { icon: <Package size={22} />, label: 'Fretes que ajudam no retorno' },
    { icon: <LockKeyhole size={22} />, label: 'Confirmação da entrega' },
    { icon: <CreditCard size={22} />, label: 'Recebimento após confirmação' },
  ];

  return (
    <section id="motorista" className="py-24 bg-slate-900 text-white border-t border-slate-800 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 text-cyan-400 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
              Para Motoristas
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Encontre fretes. <br /> Escolha suas rotas.
            </h2>
            <p className="mt-6 text-lg text-slate-400 font-medium leading-relaxed">
              Não rode de baú vazio. Acesse o radar de oportunidades na sua região, filtre por cidade de interesse e garanta seu pagamento de forma protegida.
            </p>
          </div>
          <div className="relative">
            <img src={HERO_IMG} alt="Motorista em operação de transporte" className="w-full h-72 object-cover rounded-[2rem] shadow-xl opacity-90" />
          </div>
        </div>

        {/* COMO FUNCIONA */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((s, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="w-9 h-9 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-sm mb-4">{i + 1}</div>
              <h4 className="font-bold text-white mb-1">{s.title}</h4>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* BENEFÍCIOS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <span className="text-cyan-400 shrink-0">{b.icon}</span>
              <span className="text-sm font-bold text-slate-200">{b.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mb-8 max-w-xl mx-auto">
          Você pode informar uma cidade de interesse e encontrar fretes que façam sentido para aquele destino — inclusive na volta.
        </p>

        <div className="text-center">
          <button onClick={onConfirm} className="inline-flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-cyan-500 px-12 text-sm font-black uppercase tracking-widest text-slate-950 shadow-xl hover:bg-cyan-400 transition-all hover:scale-105">
            Encontrar fretes <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 8. PRECIFICAÇÃO
// =========================================================
function PricingSection() {
  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6">Como funciona o valor do frete?</h2>
        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
          A empresa informa sua oferta de frete. A FretoGo calcula uma referência com base em fatores como distância, categoria do veículo, quantidade de paradas, tipo de carga e pedágio quando aplicável, para ajudar você a publicar um frete mais competitivo.
        </p>
        <div className="text-left max-w-xl mx-auto bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-6 py-4">
          <p className="text-sm font-bold text-amber-900">
            Ofertas muito abaixo da referência podem ter menor chance de aceitação pelos motoristas.
          </p>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 9. CONFIANÇA / SEGURANÇA
// =========================================================
function TrustSection() {
  return (
    <section className="py-24 bg-slate-900 text-white border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
              Sua operação <span className="text-cyan-400">protegida</span> de ponta a ponta.
            </h2>
            <p className="text-lg text-slate-400 font-medium mb-10 leading-relaxed">
              Você acompanha a operação, sabe quando o motorista aceita, e a entrega só é confirmada com foto e PIN. O pagamento segue o fluxo protegido da plataforma.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-xl text-cyan-400 shrink-0"><LockKeyhole size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Garantia Escrow</h4>
                  <p className="text-slate-400 text-sm mt-1">O valor fica retido na plataforma e só é liberado mediante o sucesso da operação.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-xl text-cyan-400 shrink-0"><Camera size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Comprovação Fotográfica</h4>
                  <p className="text-slate-400 text-sm mt-1">Obrigatoriedade de registro da mercadoria para atestar o descarregamento na doca.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-xl text-cyan-400 shrink-0"><ShieldCheck size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Assinatura por PIN</h4>
                  <p className="text-slate-400 text-sm mt-1">Código único de 4 dígitos para liberação sistêmica. Sem a sua autorização, não há finalização.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-cyan-500/10 blur-[80px]" />
            <div className="relative bg-slate-800 border border-slate-700 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex justify-center mb-8">
                <img src="/icon-192.png" alt="FretoGo" className="h-20 w-auto rounded-2xl shadow-xl" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black text-white mb-4">A tecnologia a favor da logística.</h3>
                <p className="text-slate-400">Junte-se às empresas e motoristas que já estão operando com segurança no ecossistema FretoGo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 10. CTA FINAL
// =========================================================
interface FinalCtaProps {
  onClient: () => void;
  onDriver: () => void;
}

function FinalCta({ onClient, onDriver }: FinalCtaProps) {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-8">
          Pronto para colocar a <span className="text-blue-600">carga na rua?</span>
        </h2>
        <p className="text-xl text-slate-600 font-medium mb-12">
          Escolha seu perfil e acesse a plataforma agora mesmo.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
           <button onClick={onClient} className="w-full sm:w-auto flex h-16 items-center justify-center rounded-[1.5rem] bg-blue-600 px-12 text-sm font-black uppercase tracking-widest text-white shadow-xl hover:bg-blue-700 transition-all hover:scale-105">
              Publicar minha carga
           </button>
           <button onClick={onDriver} className="w-full sm:w-auto flex h-16 items-center justify-center rounded-[1.5rem] bg-slate-900 px-12 text-sm font-black uppercase tracking-widest text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-105">
              Encontrar Fretes
           </button>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 11. FOOTER ESPECÍFICO DA HOME
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
        <div className="mb-16 rounded-[2rem] bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Quer receber oportunidades?</h3>
              <p className="text-sm text-slate-400 mt-1">Entre no grupo oficial de motoristas FretoGo.</p>
            </div>
          </div>
          <button onClick={onDriverGroup} className="w-full sm:w-auto shrink-0 h-14 px-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-sm transition-all active:scale-95">
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
              Logística profissional e transparente que conecta quem precisa entregar a quem pode levar.
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
// COMPONENTE PRINCIPAL
// =========================================================
export default function HomePage() {
  const navigate = useNavigate();

  // Navegação real — preservada, usada apenas nas seções de perfil
  // (após a educação) e no CTA final, nunca nos pontos de entrada.
  const goToClient = () => navigate('/cliente');
  const goToDriver = () => navigate('/motorista');
  const handleWhatsAppSupport = () => openExternalLink(PLATFORM_LINKS.SUPPORT_WHATSAPP);
  const handleDriverGroup = () => openExternalLink('https://chat.whatsapp.com/IGylgsZPYhsDfMZDKzVjHT');

  // Pontos de entrada (navbar, hero, escolha de perfil) apenas rolam
  // até a página específica do perfil — não navegam direto.
  const goToEmpresaSection = () => scrollToId('empresa');
  const goToMotoristaSection = () => scrollToId('motorista');

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600/20 overflow-x-hidden">

      {/* Noise background overlay */}
      <div className="pointer-events-none fixed inset-0 z-[60] bg-grain opacity-[0.03]" />

      <HomeNavbar
        onGoEmpresa={goToEmpresaSection}
        onGoMotorista={goToMotoristaSection}
        onSupport={handleWhatsAppSupport}
      />

      <main className="flex-grow flex flex-col pt-16">
        <Hero onGoEmpresa={goToEmpresaSection} onGoMotorista={goToMotoristaSection} />
        <Carousel />
        <AudienceChoice onGoEmpresa={goToEmpresaSection} onGoMotorista={goToMotoristaSection} />
        <CategoriesSection />
        <PersonaEmpresa onConfirm={goToClient} />
        <PersonaMotorista onConfirm={goToDriver} />
        <PricingSection />
        <TrustSection />
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
