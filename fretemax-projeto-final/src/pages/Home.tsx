// =========================================================
// NOME DO ARQUIVO: src/pages/Home.tsx
// CTO-Log: HOME-2.2 — Comunicação de problema/solução, pós-auditoria
// completa do fluxo (Cliente, Motorista, Admin, serviços de
// despacho/pagamento). Ver relatório de auditoria entregue junto com
// este arquivo para os achados de código fora do escopo da Home.
//
// O QUE MUDOU NESTA VERSÃO EM RELAÇÃO À ANTERIOR (HOME-2.1):
//
// 1) Nova seção "Problema Real → Solução" logo após o Hero: nomeia,
//    sem rodeio, a dor que empresa e motorista já sentem hoje (busca
//    manual de motorista / caminhão parado ou rodando no escuro) e
//    como a FretoGo resolve — sem inventar números, sem prometer
//    ganho ou volume de frete.
//
// 2) Nada de rotas, links ou lógica mudou nesta rodada: os CTAs
//    principais continuam indo direto para /cliente e /motorista
//    (confirmado pela leitura de src/App.tsx: não existem rotas de
//    marketing intermediárias — /cliente e /motorista SÃO as telas
//    específicas de cada perfil).
//
// Herdado das rodadas anteriores (mantido):
// - Hero com imagem em painel próprio, sem overlay escuro cobrindo a
//   foto.
// - "Como Funciona" compacto (4 passos por perfil), sem duplicar a
//   explicação que já vive em /cliente e /motorista.
// - Categorias de veículo (as 7 reais do sistema), Segurança/Escrow,
//   CTA final e rodapé com o grupo de motoristas em destaque.
//
// Nada fora de src/pages/Home.tsx foi tocado. Rotas reais (/cliente,
// /motorista), link do WhatsApp e link do grupo de motoristas
// (hardcoded, como já estava) permanecem exatamente os mesmos.
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

// =========================================================
// 1. HEADER / NAVBAR ESPECÍFICO DA HOME
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
          <button onClick={onClient} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Para Empresas</button>
          <button onClick={onDriver} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Para Motoristas</button>
          <button onClick={onSupport} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Suporte</button>
        </div>

        {/* CTAs DESKTOP */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={onDriver} className="flex h-11 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 px-5 text-sm font-black uppercase tracking-widest text-white hover:bg-slate-700 transition-all active:scale-95">
            Sou Motorista
          </button>
          <button onClick={onClient} className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95">
            Publicar Carga
          </button>
        </div>

        {/* MENU MOBILE TOGGLE */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white p-2"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MENU MOBILE EXPANDIDO */}
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
// Reformulado: imagem em painel próprio, sempre visível, sem overlay
// escuro cobrindo a fotografia inteira. Texto claro à esquerda
// (empilha acima da imagem no mobile).
// =========================================================
interface HeroProps {
  onClient: () => void;
  onDriver: () => void;
}

function Hero({ onClient, onDriver }: HeroProps) {
  return (
    <section className="relative bg-slate-900 overflow-hidden">
      <div className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* TEXTO */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
              Carga e veículo. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Conectados.</span>
            </h1>

            <p className="mt-6 max-w-md mx-auto lg:mx-0 text-lg text-slate-300 font-medium leading-relaxed">
              A FretoGo conecta empresas que precisam transportar com motoristas prontos para rodar.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={onClient}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all hover:bg-blue-500"
              >
                Publicar uma carga <ArrowRight size={18} />
              </button>
              <button
                onClick={onDriver}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-8 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-700 hover:border-cyan-500/50"
              >
                Encontrar fretes <ArrowRight size={18} className="text-cyan-400" />
              </button>
            </div>
          </div>

          {/* IMAGEM — painel próprio, visível, sem overlay pesado */}
          <div className="relative h-64 sm:h-80 lg:h-[26rem] rounded-[2rem] overflow-hidden shadow-2xl">
            <img
              src={HERO_IMG}
              alt="Caminhão em rodovia durante operação de transporte de carga"
              className="h-full w-full object-cover"
            />
            {/* gradiente localizado apenas na base, para dar profundidade sem esconder a foto */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem]" />
          </div>

        </div>
      </div>
    </section>
  );
}

// =========================================================
// 3. PROBLEMA REAL → SOLUÇÃO
// Nomeia, sem rodeio, o problema que empresas e motoristas de
// qualquer categoria enfrentam hoje — e como a FretoGo resolve.
// Gatilho de comunicação: apontar a dor antes de vender a solução,
// sem exagero e sem prometer o que o sistema não entrega.
// =========================================================
function ProblemSolution() {
  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">O problema não é falta de frete. É falta de conexão.</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* EMPRESA */}
          <div className="rounded-[2rem] border border-slate-200 p-8 sm:p-10">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4">Se você tem uma carga</p>
            <p className="text-xl font-bold text-slate-900 leading-snug mb-4">
              Ligar de motorista em motorista, negociar no escuro e torcer pra ele aparecer.
            </p>
            <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
              <ArrowRight size={18} className="text-blue-600 mt-1 shrink-0" />
              <p className="text-slate-600 font-medium">
                Na FretoGo você publica uma vez. O motorista certo aparece, e o pagamento só sai da sua mão quando a entrega é confirmada.
              </p>
            </div>
          </div>

          {/* MOTORISTA */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-8 sm:p-10">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-4">Se você tem um veículo</p>
            <p className="text-xl font-bold text-white leading-snug mb-4">
              Caminhão parado é prejuízo. Rodar sem saber quanto vai receber, também.
            </p>
            <div className="flex items-start gap-3 pt-4 border-t border-slate-800">
              <ArrowRight size={18} className="text-cyan-400 mt-1 shrink-0" />
              <p className="text-slate-400 font-medium">
                Na FretoGo você vê o valor líquido antes de aceitar, escolhe a oportunidade que faz sentido pra sua rota e sabe que o recebimento está garantido pelo fluxo protegido da plataforma.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// =========================================================
// 4. CARROSSEL (BANNER SECUNDÁRIO)
// =========================================================
function Carousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const slides = [
    { icon: <Search size={22} />, title: 'Encontre o veículo certo', desc: 'Da moto ao bitrem, cada operação tem uma categoria adequada.' },
    { icon: <MapPin size={22} />, title: 'Oportunidades por região', desc: 'Motoristas acompanham cargas conforme a área de interesse.' },
    { icon: <ShieldCheck size={22} />, title: 'Pagamento protegido', desc: 'O valor combinado fica retido até a confirmação da entrega.' },
    { icon: <MessageCircle size={22} />, title: 'Plataforma em evolução', desc: 'A FretoGo segue ampliando categorias e funcionalidades.' },
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
    <section className="py-12 bg-slate-50 border-t border-b border-slate-200">
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
// 5. QUAL É O SEU PERFIL?
// CTAs navegam direto para /cliente e /motorista — as próprias telas
// específicas são responsáveis por explicar e qualificar cada público.
// =========================================================
interface AudienceChoiceProps {
  onClient: () => void;
  onDriver: () => void;
}

function AudienceChoice({ onClient, onDriver }: AudienceChoiceProps) {
  return (
    <section className="py-24 bg-white relative z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Qual é o seu perfil?</h2>
          <p className="mt-4 text-lg text-slate-600 font-medium">Escolha seu caminho para continuar.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

          {/* CARD EMPRESA */}
          <div className="bg-slate-50 rounded-[2rem] p-8 sm:p-10 shadow-lg border border-slate-200 flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 border border-blue-100">
              <Package size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Tem uma carga para transportar?</h3>
            <p className="text-slate-600 mb-8 flex-grow text-base leading-relaxed">
              Publique sua carga, encontre o veículo adequado e acompanhe a operação.
            </p>
            <button onClick={onClient} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-2">
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
              Encontre oportunidades, escolha as que fazem sentido para sua rota.
            </p>
            <button onClick={onDriver} className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2">
              Encontrar fretes <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

// =========================================================
// 6. CATEGORIAS DE VEÍCULOS
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
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Um veículo para cada operação</h2>
          <p className="mt-4 text-lg text-slate-600 font-medium">
            A FretoGo atende diferentes tipos de carga, do moto-frete ao transporte pesado.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
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
// 7. COMO FUNCIONA
// Bloco compacto — 4 passos por perfil, sem duplicar o papel de
// /cliente e /motorista, que seguem responsáveis pela explicação
// completa de cada fluxo.
// =========================================================
function HowItWorks() {
  const empresaSteps = [
    { icon: <Package size={22} />, title: 'Publicação da carga', desc: 'Informe origem, destino, tipo de veículo e valor da oferta.' },
    { icon: <CreditCard size={22} />, title: 'Pagamento seguro', desc: 'O pagamento é feito para liberar a rota assim que um motorista aceita.' },
    { icon: <MapPin size={22} />, title: 'Acompanhamento', desc: 'Acompanhe o status da coleta e do deslocamento.' },
    { icon: <Camera size={22} />, title: 'Confirmação da entrega', desc: 'Foto e PIN confirmam que a operação foi concluída.' },
  ];

  const motoristaSteps = [
    { icon: <Search size={22} />, title: 'Encontre oportunidades', desc: 'Veja as cargas disponíveis na sua região.' },
    { icon: <CheckCircle2 size={22} />, title: 'Escolha o frete', desc: 'Selecione a oportunidade que faz sentido para sua rota.' },
    { icon: <Truck size={22} />, title: 'Realize o transporte', desc: 'Vá até a coleta e siga com a operação.' },
    { icon: <CreditCard size={22} />, title: 'Entrega e recebimento', desc: 'Confirme a entrega e receba conforme o fluxo da plataforma.' },
  ];

  return (
    <section className="py-24 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Como funciona</h2>
          <p className="mt-4 text-lg text-slate-600 font-medium">Um processo simples, do início ao fim da operação.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* EMPRESA */}
          <div>
            <h3 className="text-lg font-black text-blue-600 uppercase tracking-widest mb-6">Para Empresas</h3>
            <div className="space-y-4">
              {empresaSteps.map((s, i) => (
                <div key={i} className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{s.title}</h4>
                    <p className="text-sm text-slate-600 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOTORISTA */}
          <div>
            <h3 className="text-lg font-black text-cyan-500 uppercase tracking-widest mb-6">Para Motoristas</h3>
            <div className="space-y-4">
              {motoristaSteps.map((s, i) => (
                <div key={i} className="flex items-start gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{s.title}</h4>
                    <p className="text-sm text-slate-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// =========================================================
// 8. CONFIANÇA / SEGURANÇA
// Explica o mecanismo, sem discurso de propaganda.
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
              Existe um processo organizado para reduzir problemas: você acompanha a operação, sabe quando o motorista aceita e a entrega só é confirmada com foto e PIN.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-xl text-cyan-400 shrink-0"><LockKeyhole size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Pagamento protegido</h4>
                  <p className="text-slate-400 text-sm mt-1">O valor fica retido na plataforma e só é liberado após o sucesso da operação.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-xl text-cyan-400 shrink-0"><Camera size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Foto da entrega</h4>
                  <p className="text-slate-400 text-sm mt-1">Registro da mercadoria para atestar o descarregamento na doca.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-slate-800 p-3 rounded-xl text-cyan-400 shrink-0"><ShieldCheck size={24} /></div>
                <div>
                  <h4 className="font-bold text-lg text-white">Confirmação por PIN</h4>
                  <p className="text-slate-400 text-sm mt-1">Código único para liberação sistêmica. Sem a sua autorização, não há finalização.</p>
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
                <p className="text-slate-400">Uma plataforma pensada para dar segurança a cada etapa, da publicação à confirmação de entrega.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 9. CTA FINAL
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
// 10. FOOTER ESPECÍFICO DA HOME
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

  // Navegação real — os CTAs principais da Home levam direto para a
  // tela específica de cada perfil, que é responsável por explicar e
  // qualificar aquele público.
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
        <ProblemSolution />
        <Carousel />
        <AudienceChoice onClient={goToClient} onDriver={goToDriver} />
        <CategoriesSection />
        <HowItWorks />
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
