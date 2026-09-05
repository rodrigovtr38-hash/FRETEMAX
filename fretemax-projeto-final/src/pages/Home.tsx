import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_LINKS, openExternalLink } from '../config/platformLinks';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  LockKeyhole,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Truck,
  Users,
  X,
  Zap,
} from 'lucide-react';

/**
 * Home FretoGo — evolução visual, comunicação e navegação.
 *
 * Escopo preservado:
 * - Mantém as rotas /cliente e /motorista.
 * - Mantém o suporte pelo PLATFORM_LINKS.SUPPORT_WHATSAPP.
 * - Mantém o destino atual do grupo de motoristas.
 * - Não cria rotas, fluxos operacionais ou regras de negócio.
 */
const HERO_IMG = 'https://images.hostinger.com/f09fbe30-dd15-4b3b-aede-622f9534802d.png';
const DRIVER_GROUP_URL = 'https://chat.whatsapp.com/IGylgsZPYhsDfMZDKzVjHT';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

interface NavigationProps {
  onClient: () => void;
  onDriver: () => void;
  onSupport: () => void;
}

function HomeNavbar({ onClient, onDriver, onSupport }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeAndRun = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-200 ${
        scrolled
          ? 'border-slate-800/90 bg-slate-950/95 shadow-lg shadow-slate-950/20 backdrop-blur'
          : 'border-transparent bg-slate-950/75 backdrop-blur-sm'
      }`}
    >
      <nav
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Navegação principal"
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label="Voltar ao início"
        >
          <img
            src="/icon-192.png"
            alt="FretoGo"
            className="h-10 w-auto rounded-md object-contain sm:h-11"
          />
        </button>

        <div className="hidden items-center gap-7 md:flex">
          <button
            type="button"
            onClick={() => scrollToId('empresas')}
            className="text-sm font-bold text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
          >
            Para empresas
          </button>
          <button
            type="button"
            onClick={() => scrollToId('motoristas')}
            className="text-sm font-bold text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
          >
            Para motoristas
          </button>
          <button
            type="button"
            onClick={onSupport}
            className="text-sm font-bold text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
          >
            Suporte
          </button>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={onDriver}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-slate-600 hover:bg-slate-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Sou motorista
          </button>
          <button
            type="button"
            onClick={onClient}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Publicar carga
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="inline-flex rounded-lg p-2 text-slate-100 transition hover:bg-slate-800 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuOpen ? <X size={25} aria-hidden="true" /> : <Menu size={25} aria-hidden="true" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-slate-800 bg-slate-950 px-4 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            <button
              type="button"
              onClick={() => closeAndRun(() => scrollToId('empresas'))}
              className="rounded-xl px-4 py-3 text-left text-base font-bold text-white transition hover:bg-slate-900"
            >
              Para empresas
            </button>
            <button
              type="button"
              onClick={() => closeAndRun(() => scrollToId('motoristas'))}
              className="rounded-xl px-4 py-3 text-left text-base font-bold text-white transition hover:bg-slate-900"
            >
              Para motoristas
            </button>
            <button
              type="button"
              onClick={() => closeAndRun(onSupport)}
              className="rounded-xl px-4 py-3 text-left text-base font-bold text-white transition hover:bg-slate-900"
            >
              Suporte WhatsApp
            </button>
            <div className="my-3 h-px bg-slate-800" />
            <button
              type="button"
              onClick={() => closeAndRun(onClient)}
              className="inline-flex min-h-14 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 active:scale-[0.97]"
            >
              Publicar carga
            </button>
            <button
              type="button"
              onClick={() => closeAndRun(onDriver)}
              className="inline-flex min-h-14 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800 active:scale-[0.97]"
            >
              Encontrar fretes
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

interface HeroProps {
  onClient: () => void;
  onDriver: () => void;
}

function Hero({ onClient, onDriver }: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[720px] items-center overflow-hidden bg-slate-950 pt-24 sm:min-h-[680px] lg:min-h-[720px]">
      <img
        src={HERO_IMG}
        alt="Caminhões em uma rodovia, representando uma operação logística em movimento"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center] opacity-90 sm:object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/78 via-44% to-slate-950/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
      <div className="pointer-events-none absolute -right-40 top-10 -z-10 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-slate-950/45 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
            Operação logística conectada
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
            Carga e veículo.{' '}
            <span className="text-cyan-300">Conectados.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-200 sm:text-xl">
            A FretoGo conecta empresas que precisam transportar com motoristas prontos para rodar.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClient}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-white shadow-xl shadow-blue-950/50 transition hover:bg-blue-500 active:scale-[0.97] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Publicar uma carga <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDriver}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-300/30 bg-slate-950/35 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-white backdrop-blur-sm transition hover:border-cyan-300/60 hover:bg-slate-900/75 active:scale-[0.97] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <Truck size={18} className="text-cyan-300" aria-hidden="true" />
              Encontrar fretes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


function ProblemSection() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">O problema real</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">O problema não é falta de frete. É falta de conexão.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">Para empresas</span>
              <p className="mt-4 text-lg font-bold leading-relaxed text-slate-800">Ligar de motorista em motorista, negociar no escuro e esperar alguém aparecer não deveria fazer parte da rotina.</p>
              <p className="mt-5 text-sm font-medium leading-relaxed text-slate-600">A empresa publica a carga e organiza as informações da operação em um só lugar.</p>
            </article>
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-cyan-700">Para motoristas</span>
              <p className="mt-4 text-lg font-bold leading-relaxed text-slate-800">Ter um caminhão parado também custa. Rodar sem saber o que foi combinado também pesa.</p>
              <p className="mt-5 text-sm font-medium leading-relaxed text-slate-600">O motorista encontra oportunidades e analisa o frete antes de escolher.</p>
            </article>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">Empresa publica a carga</span>
          <ArrowRight className="hidden text-slate-400 sm:block" size={18} aria-hidden="true" />
          <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-800">Motorista encontra oportunidades</span>
          <ArrowRight className="hidden text-slate-400 sm:block" size={18} aria-hidden="true" />
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white">A FretoGo organiza a conexão</span>
        </div>
      </div>
    </section>
  );
}

function EducationalCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slides = [
    { title: 'Encontre o veículo certo', text: 'Moto ao bitrem, com categorias para diferentes necessidades de transporte.', icon: <Truck size={22} aria-hidden="true" /> },
    { title: 'Publique em poucos passos', text: 'Informe origem, destino, veículo e valor da oferta.', icon: <Package size={22} aria-hidden="true" /> },
    { title: 'Acompanhe a operação', text: 'Veja o andamento da coleta e da entrega pelo fluxo da plataforma.', icon: <MapPin size={22} aria-hidden="true" /> },
    { title: 'Pagamento protegido', text: 'O processo de pagamento acontece dentro do fluxo da plataforma.', icon: <CreditCard size={22} aria-hidden="true" /> },
    { title: 'Fretes que fazem sentido', text: 'O motorista pode informar uma cidade de interesse para encontrar oportunidades naquela direção.', icon: <Search size={22} aria-hidden="true" /> },
  ];
  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
    setActive(index);
  };
  return (
    <section className="border-b border-slate-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Para entender a plataforma</p><h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">Informação para decidir com clareza</h2></div>
          <div className="hidden gap-2 sm:flex"><button type="button" onClick={() => goTo(Math.max(active - 1, 0))} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50" aria-label="Slide anterior">←</button><button type="button" onClick={() => goTo(Math.min(active + 1, slides.length - 1))} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50" aria-label="Próximo slide">→</button></div>
        </div>
        <div ref={trackRef} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onScroll={(event) => setActive(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
          {slides.map((slide) => <article key={slide.title} className="w-full shrink-0 snap-start rounded-[1.75rem] border border-slate-200 bg-slate-50 p-7 sm:p-9"><div className="flex max-w-2xl items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">{slide.icon}</span><div><h3 className="text-xl font-black text-slate-950 sm:text-2xl">{slide.title}</h3><p className="mt-2 text-base font-medium leading-relaxed text-slate-600">{slide.text}</p></div></div></article>)}
        </div>
        <div className="mt-5 flex justify-center gap-2" aria-label="Navegação do carrossel">{slides.map((slide, index) => <button key={slide.title} type="button" onClick={() => goTo(index)} aria-label={`Ir para ${slide.title}`} className={`h-2 rounded-full transition-all ${index === active ? 'w-7 bg-blue-600' : 'w-2 bg-slate-300'}`} />)}</div>
      </div>
    </section>
  );
}

function InterdependenceSection() {
  return (
    <section className="bg-slate-950 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">A conexão</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Uma operação depende dos dois lados.</h2><p className="mt-5 text-lg font-medium leading-relaxed text-slate-300">Quem precisa transportar precisa de quem possa transportar. Quem transporta precisa de uma carga para rodar.</p></div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-7 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.15em] text-blue-300">Empresa</p><ul className="mt-5 space-y-3 text-sm font-bold leading-relaxed text-slate-200"><li>Tem uma carga.</li><li>Precisa transportar.</li><li>Precisa acompanhar.</li><li>Precisa receber confirmação.</li></ul></article>
          <div className="flex items-center justify-center text-cyan-300"><ArrowRight className="hidden md:block" size={28} aria-hidden="true" /><span className="md:hidden">↕</span></div>
          <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900 p-7 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-300">Motorista</p><ul className="mt-5 space-y-3 text-sm font-bold leading-relaxed text-slate-200"><li>Tem um veículo.</li><li>Precisa encontrar fretes.</li><li>Precisa saber o que foi combinado.</li><li>Precisa receber pelo trabalho.</li></ul></article>
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg font-black leading-relaxed text-cyan-100">É simples. Um lado precisa do outro. A FretoGo aproxima os dois.</p>
      </div>
    </section>
  );
}

interface AudienceChoiceProps {
  onClient: () => void;
  onDriver: () => void;
}

function AudienceChoice({ onClient, onDriver }: AudienceChoiceProps) {
  return (
    <section id="perfil" className="scroll-mt-24 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Comece pelo seu perfil</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Qual é o seu perfil?
          </h2>
          <p className="mt-4 text-lg font-medium leading-relaxed text-slate-600">
            Escolha o caminho que corresponde à sua operação.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:gap-8">
          <article className="flex min-h-full flex-col rounded-[2rem] border border-slate-200 bg-slate-50 p-7 shadow-[0_18px_45px_rgba(15,23,42,0.07)] sm:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <Package size={28} aria-hidden="true" />
            </div>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.16em] text-blue-600">Empresa</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.025em] text-slate-950">
              Tem uma carga para transportar?
            </h3>
            <p className="mt-4 flex-grow text-base font-medium leading-relaxed text-slate-600">
              Publique a carga, encontre o veículo adequado e acompanhe cada etapa da operação.
            </p>
            <button
              type="button"
              onClick={onClient}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Publicar minha carga <ChevronRight size={18} aria-hidden="true" />
            </button>
          </article>

          <article className="flex min-h-full flex-col rounded-[2rem] border border-slate-800 bg-slate-950 p-7 shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-300">
              <Truck size={28} aria-hidden="true" />
            </div>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Motorista</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.025em] text-white">
              Tem um veículo e quer encontrar fretes?
            </h3>
            <p className="mt-4 flex-grow text-base font-medium leading-relaxed text-slate-300">
              Encontre oportunidades compatíveis com seu veículo, veja o valor antes de aceitar e escolha rotas que façam sentido.
            </p>
            <button
              type="button"
              onClick={onDriver}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Encontrar fretes <ChevronRight size={18} aria-hidden="true" />
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}

function CompanySection({ onClient }: Pick<NavigationProps, 'onClient'>) {
  const process = [
    { title: 'Publique', detail: 'Informe a carga e o que sua operação precisa.' },
    { title: 'Encontre', detail: 'Conecte-se ao veículo certo para o transporte.' },
    { title: 'Acompanhe', detail: 'Veja o andamento da operação pelo fluxo da plataforma.' },
    { title: 'Confirme', detail: 'Valide a entrega com os recursos disponíveis.' },
  ];

  return (
    <section id="empresas" className="scroll-mt-24 border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Para empresas</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
              Publique sua carga. Encontre o veículo certo.
            </h2>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-600">
              Organize a operação em um só caminho: publique, acompanhe e confirme a entrega com clareza.
            </p>
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
              Você informa o valor que deseja oferecer. A plataforma apresenta uma referência para ajudar na construção de uma oferta compatível com a operação e a categoria do veículo.
            </p>
            <button
              type="button"
              onClick={onClient}
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-white shadow-xl shadow-blue-950/15 transition hover:bg-blue-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Publicar minha carga <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-950/20">
            <img
              src={HERO_IMG}
              alt="Operação logística com veículos em rota"
              className="h-72 w-full object-cover object-center opacity-95 sm:h-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/15 bg-slate-950/75 p-4 text-white backdrop-blur-sm">
              <p className="text-sm font-black">Operação com mais contexto</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">Do anúncio da carga à confirmação da entrega.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {process.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DriverSection({ onDriver }: Pick<NavigationProps, 'onDriver'>) {
  const capabilities = [
    { icon: <Search size={19} aria-hidden="true" />, text: 'Oportunidades disponíveis para consulta' },
    { icon: <MapPin size={19} aria-hidden="true" />, text: 'Filtro por cidade de interesse' },
    { icon: <Truck size={19} aria-hidden="true" />, text: 'Categorias de veículos' },
    { icon: <CheckCircle2 size={19} aria-hidden="true" />, text: 'Acompanhamento e confirmação da entrega' },
  ];

  return (
    <section id="motoristas" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
          <div className="order-2 relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/30 lg:order-1">
            <img
              src={HERO_IMG}
              alt="Veículos em deslocamento numa rota logística"
              className="h-72 w-full object-cover object-[70%_center] opacity-85 sm:h-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/75 px-4 py-2 text-xs font-black uppercase tracking-[0.13em] text-cyan-200 backdrop-blur-sm">
                <MapPin size={15} aria-hidden="true" /> Escolha suas rotas
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Para motoristas</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-5xl">
              Encontre fretes. Escolha suas rotas.
            </h2>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-300">
              Encontre oportunidades compatíveis com seu veículo, veja o valor antes de aceitar e escolha os fretes que façam sentido para sua rota.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item.text} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <span className="mt-0.5 shrink-0 text-cyan-300">{item.icon}</span>
                  <p className="text-sm font-bold leading-relaxed text-slate-200">{item.text}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onDriver}
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-slate-950 shadow-xl shadow-cyan-950/20 transition hover:bg-cyan-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Encontrar fretes <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


function CityInterestSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Um diferencial para o motorista</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">Encontre fretes que façam sentido para sua rota.</h2>
            <p className="mt-6 text-lg font-medium leading-relaxed text-slate-600">O motorista pode informar uma cidade de interesse e o sistema pode ajudá-lo a encontrar oportunidades naquela direção.</p>
            <p className="mt-5 text-sm font-bold leading-relaxed text-slate-500">Isso não garante disponibilidade. Ajuda a procurar uma oportunidade que aproxime o motorista do destino que deseja.</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="rounded-2xl bg-slate-950 p-5 text-center text-white"><span className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Exemplo</span><p className="mt-2 text-xl font-black">“Quero voltar para Campinas.”</p></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:items-center"><div className="rounded-xl bg-blue-50 p-4 text-center text-sm font-black text-blue-800">Entrega atual</div><span className="text-center text-xl font-black text-slate-400 sm:block">→</span><div className="rounded-xl bg-cyan-50 p-4 text-center text-sm font-black text-cyan-800">Cidade de interesse</div><span className="hidden text-center text-xl font-black text-slate-400 sm:block">→</span><div className="rounded-xl bg-slate-100 p-4 text-center text-sm font-black text-slate-800 sm:col-start-3">Nova oportunidade</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OperationFlowSection() {
  const steps = ['Empresa publica', 'Frete fica disponível', 'Motorista encontra', 'Motorista aceita', 'Empresa acompanha', 'Pagamento', 'Coleta', 'Transporte', 'Entrega', 'Foto + PIN', 'Entrega confirmada'];
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">O fluxo completo</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">Agora você entende o caminho da operação.</h2><p className="mt-4 text-lg font-medium leading-relaxed text-slate-600">Cada etapa tem uma função clara, do anúncio da carga à confirmação da entrega.</p></div>
        <ol className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">{steps.map((step, index) => <li key={step} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span><span className="text-sm font-bold text-slate-800">{step}</span></li>)}</ol>
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-900 py-16 text-white sm:py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Uma relação mais clara</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Cada um tem seu papel.</h2><div className="mt-10 grid gap-4 text-left sm:grid-cols-3"><div className="rounded-2xl border border-slate-700 bg-slate-800 p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-blue-300">Empresa</p><p className="mt-3 font-bold leading-relaxed text-slate-100">Tem uma necessidade.</p></div><div className="rounded-2xl border border-slate-700 bg-slate-800 p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-300">Motorista</p><p className="mt-3 font-bold leading-relaxed text-slate-100">Tem uma capacidade de transporte.</p></div><div className="rounded-2xl border border-slate-700 bg-slate-800 p-6"><p className="text-xs font-black uppercase tracking-[0.15em] text-amber-300">FretoGo</p><p className="mt-3 font-bold leading-relaxed text-slate-100">Organiza a conexão.</p></div></div><p className="mx-auto mt-9 max-w-2xl text-base font-medium leading-relaxed text-slate-300">Quando os dois lados entendem o que precisam e o que foi combinado, a operação fica mais clara para todos.</p><div className="mt-6 flex justify-center gap-3 text-xs font-black uppercase tracking-[0.14em] text-cyan-200"><span>Respeito</span><span>•</span><span>Clareza</span><span>•</span><span>Confiança</span></div></div>
    </section>
  );
}

function CategoriesSection() {
  const categories = [
    { name: 'Moto', icon: <Zap size={24} aria-hidden="true" /> },
    { name: 'Carro', icon: <Package size={24} aria-hidden="true" /> },
    { name: 'Utilitário', icon: <Package size={24} aria-hidden="true" /> },
    { name: 'Toco', icon: <Truck size={24} aria-hidden="true" /> },
    { name: 'Truck', icon: <Truck size={24} aria-hidden="true" /> },
    { name: 'Carreta', icon: <Truck size={24} aria-hidden="true" /> },
    { name: 'Bitrem', icon: <Truck size={24} aria-hidden="true" /> },
  ];

  return (
    <section className="border-y border-slate-200 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Categorias</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Do pequeno ao pesado
          </h2>
          <p className="mt-4 text-lg font-medium leading-relaxed text-slate-600">
            Da entrega local ao transporte de maior porte, escolha a categoria adequada para sua carga ou veículo.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {category.icon}
              </span>
              <span className="text-sm font-black text-slate-900">{category.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const companySteps = [
    'Publicação da carga',
    'Pagamento protegido',
    'Acompanhamento',
    'Confirmação da entrega',
  ];
  const driverSteps = [
    'Encontre oportunidades',
    'Escolha o frete',
    'Realize o transporte',
    'Entrega e recebimento',
  ];

  const renderSteps = (steps: string[], accent: 'blue' | 'cyan') =>
    steps.map((step, index) => (
      <li key={step} className="flex items-start gap-4">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
            accent === 'blue' ? 'bg-blue-600 text-white' : 'bg-cyan-400 text-slate-950'
          }`}
        >
          {index + 1}
        </span>
        <span className="pt-1 text-sm font-bold leading-relaxed text-slate-700">{step}</span>
      </li>
    ));

  return (
    <section id="como-funciona" className="scroll-mt-24 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Como funciona</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Um processo simples de acompanhar
          </h2>
          <p className="mt-4 text-lg font-medium leading-relaxed text-slate-600">
            Cada perfil segue etapas claras para manter a operação organizada.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Package size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">Empresa</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">Da carga à confirmação</h3>
              </div>
            </div>
            <ol className="mt-7 space-y-5">{renderSteps(companySteps, 'blue')}</ol>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Truck size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-700">Motorista</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">Da oportunidade à entrega</h3>
              </div>
            </div>
            <ol className="mt-7 space-y-5">{renderSteps(driverSteps, 'cyan')}</ol>
          </article>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const points = [
    {
      icon: <CreditCard size={23} aria-hidden="true" />,
      title: 'Pagamento protegido',
      description: 'O pagamento acompanha o fluxo da plataforma até a confirmação da operação.',
    },
    {
      icon: <Camera size={23} aria-hidden="true" />,
      title: 'Foto da entrega',
      description: 'O registro da entrega faz parte da confirmação disponível na operação.',
    },
    {
      icon: <LockKeyhole size={23} aria-hidden="true" />,
      title: 'Confirmação por PIN',
      description: 'A confirmação utiliza o PIN conforme o fluxo da plataforma.',
    },
    {
      icon: <ShieldCheck size={23} aria-hidden="true" />,
      title: 'Acompanhamento',
      description: 'As etapas visíveis ajudam os dois lados a entender o andamento do transporte.',
    },
  ];

  return (
    <section className="bg-slate-950 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Segurança e confiança</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-5xl">
              Confiança não é uma promessa. É um processo.
            </h2>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-300">
              A segurança aparece no processo: pagamento protegido, acompanhamento, registro da entrega e confirmação por PIN quando aplicável.
            </p>
            <blockquote className="mt-8 border-l-2 border-cyan-300 pl-4 text-base font-bold leading-relaxed text-cyan-100">
              Existe um processo organizado para reduzir problemas.
            </blockquote>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {points.map((point) => (
              <article key={point.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                  {point.icon}
                </span>
                <h3 className="mt-5 text-lg font-black text-white">{point.title}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-300">{point.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface GroupProps {
  onDriverGroup: () => void;
}

function DriverGroupSection({ onDriverGroup }: GroupProps) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 p-7 shadow-2xl shadow-slate-950/15 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
                <Users size={30} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Para motoristas</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
                  Quer receber oportunidades?
                </h2>
                <p className="mt-2 text-base font-medium text-slate-300">Entre no grupo oficial de motoristas FretoGo.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDriverGroup}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-cyan-400 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-slate-950 transition hover:bg-cyan-300 active:scale-[0.97] lg:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Entrar no grupo <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FinalCtaProps extends NavigationProps {}

function FinalCta({ onClient, onDriver }: FinalCtaProps) {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">
          Pronto para começar?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-relaxed text-slate-600">
          Acesse a área específica para entender os próximos passos da sua operação.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={onClient}
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-white shadow-xl shadow-blue-950/15 transition hover:bg-blue-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Publicar minha carga <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDriver}
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black uppercase tracking-[0.13em] text-white shadow-xl shadow-slate-950/15 transition hover:bg-slate-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2"
          >
            Encontrar fretes <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

interface FooterProps extends NavigationProps, GroupProps {}

function HomeFooter({ onClient, onDriver, onSupport, onDriverGroup }: FooterProps) {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-14 text-slate-400 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-11 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              aria-label="Voltar ao início"
            >
              <img src="/icon-192.png" alt="FretoGo" className="h-10 w-auto rounded-md" />
            </button>
            <p className="mt-5 max-w-xs text-sm font-medium leading-relaxed text-slate-500">
              Uma plataforma para conectar quem precisa transportar a quem está pronto para levar.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">Empresas</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <button type="button" onClick={onClient} className="text-sm font-bold transition hover:text-blue-300 focus-visible:outline-none focus-visible:text-blue-300">
                  Publicar carga
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId('como-funciona')} className="text-sm font-bold transition hover:text-blue-300 focus-visible:outline-none focus-visible:text-blue-300">
                  Como funciona
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">Motoristas</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <button type="button" onClick={onDriver} className="text-sm font-bold transition hover:text-cyan-300 focus-visible:outline-none focus-visible:text-cyan-300">
                  Encontrar fretes
                </button>
              </li>
              <li>
                <button type="button" onClick={onDriverGroup} className="text-sm font-bold transition hover:text-cyan-300 focus-visible:outline-none focus-visible:text-cyan-300">
                  Grupo de motoristas
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-white">Suporte &amp; mais</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <button type="button" onClick={onSupport} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 transition hover:text-emerald-300 focus-visible:outline-none focus-visible:text-emerald-300">
                  <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                </button>
              </li>
              <li>
                <span className="text-sm font-bold text-slate-600" title="Preparado para uso futuro">Blog</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-900 pt-7 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
            <p className="text-xs font-bold text-slate-600">FretoGo Tecnologia</p>
            <p className="text-xs font-bold text-slate-600">CNPJ: 64.172.243/0001-90</p>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700">
            © {new Date().getFullYear()} FretoGo — Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp({ onSupport }: Pick<NavigationProps, 'onSupport'>) {
  return (
    <button
      type="button"
      onClick={onSupport}
      title="Fale com nosso suporte"
      aria-label="Falar com o suporte pelo WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.38)] transition hover:scale-105 hover:shadow-[0_15px_35px_rgba(37,211,102,0.48)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  // Rotas e destinos preservados conforme a modelagem atual da plataforma.
  const goToClient = () => navigate('/cliente');
  const goToDriver = () => navigate('/motorista');
  const handleWhatsAppSupport = () => openExternalLink(PLATFORM_LINKS.SUPPORT_WHATSAPP);
  const handleDriverGroup = () => openExternalLink(DRIVER_GROUP_URL);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-white font-sans text-slate-900 selection:bg-cyan-200 selection:text-slate-950">
      <HomeNavbar onClient={goToClient} onDriver={goToDriver} onSupport={handleWhatsAppSupport} />
      <main>
        <Hero onClient={goToClient} onDriver={goToDriver} />
        <ProblemSection />
        <EducationalCarousel />
        <AudienceChoice onClient={goToClient} onDriver={goToDriver} />
        <InterdependenceSection />
        <CompanySection onClient={goToClient} />
        <DriverSection onDriver={goToDriver} />
        <CityInterestSection />
        <CategoriesSection />
        <HowItWorksSection />
        <OperationFlowSection />
        <TrustSection />
        <RolesSection />
        <DriverGroupSection onDriverGroup={handleDriverGroup} />
        <FinalCta onClient={goToClient} onDriver={goToDriver} onSupport={handleWhatsAppSupport} />
      </main>
      <HomeFooter
        onClient={goToClient}
        onDriver={goToDriver}
        onSupport={handleWhatsAppSupport}
        onDriverGroup={handleDriverGroup}
      />
      <FloatingWhatsApp onSupport={handleWhatsAppSupport} />
    </div>
  );
}
