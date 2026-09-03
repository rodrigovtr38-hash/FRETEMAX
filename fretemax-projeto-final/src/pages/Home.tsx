// =========================================================
// NOME DO ARQUIVO: src/pages/Home.tsx
// CTO-Log: HOME-VISUAL-03. Evolução de Arquitetura e UX B2B/B2C.
// Status: Reestruturação da Landing Page Oficial FretoGo inspirada em 
// usabilidade de grandes plataformas logísticas (clareza, hierarquia e conversão).
// Integração visual da marca oficial (icon-192.png) sem bordas artificiais.
// Todas as rotas, links de WhatsApp, grupos e serviços preservados.
// FIX VERCEL BUILD: Remoção definitiva das dependências fantasmas ("react-helmet", 
// "@/components/Seo" e "@/components/Reveal") que causavam erro ENOENT no Rollup/Vite.
// =========================================================

import React, { useState, useEffect } from 'react';
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
  Zap
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
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
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
// =========================================================
interface HeroProps {
  onClient: () => void;
  onDriver: () => void;
}

function Hero({ onClient, onDriver }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900 min-h-[90vh] flex items-center">
      <div className="absolute inset-0 z-0">
        <img src={HERO_IMG} alt="Rodovia Logística" className="h-full w-full object-cover opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900"></div>
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="max-w-4xl mx-auto font-display text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
          O transporte já tem a demanda. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Falta conectar melhor quem precisa transportar com quem está pronto para rodar.
          </span>
        </h1>
        
        <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 font-medium leading-relaxed">
          A FretoGo é a plataforma que simplifica a logística. Conectamos empresas a transportadores de forma direta, segura e com pagamento blindado.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
          <button 
            onClick={onClient}
            className="w-full sm:w-auto flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 px-10 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:bg-blue-500"
          >
            Publicar Carga <ArrowRight size={18} />
          </button>
          <button 
            onClick={onDriver}
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
// 3. ENTRADA PARA EMPRESA E MOTORISTA
// =========================================================
interface AudienceSplitProps {
  onClient: () => void;
  onDriver: () => void;
}

function AudienceSplit({ onClient, onDriver }: AudienceSplitProps) {
  return (
    <section className="py-24 bg-slate-50 relative z-20 -mt-8 rounded-t-[2.5rem] border-t border-slate-200 shadow-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* CARD EMPRESA */}
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-lg border border-slate-200 flex flex-col h-full transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 border border-blue-100">
              <Package size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Tem uma carga para entregar?</h2>
            <p className="text-slate-600 mb-8 flex-grow text-lg leading-relaxed">
              Pare de perder tempo buscando veículos. Publique sua carga, acompanhe a entrega em tempo real e tenha a garantia da mercadoria validada na doca.
            </p>
            <ul className="space-y-4 mb-10 text-slate-700 font-bold text-sm">
              <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-500 w-6 h-6"/> Publicação rápida e simplificada</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-500 w-6 h-6"/> Acompanhamento em tempo real</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-blue-500 w-6 h-6"/> Motoristas homologados pela plataforma</li>
            </ul>
            <button onClick={onClient} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md flex items-center justify-center gap-2">
              Publicar minha carga <ChevronRight size={18} />
            </button>
          </div>

          {/* CARD MOTORISTA */}
          <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl border border-slate-800 flex flex-col h-full text-white transition-transform hover:-translate-y-1 hover:shadow-2xl">
            <div className="h-16 w-16 bg-slate-800 text-cyan-400 rounded-2xl flex items-center justify-center mb-8 border border-slate-700">
              <Truck size={32} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Tem um veículo e quer fretes?</h2>
            <p className="text-slate-400 mb-8 flex-grow text-lg leading-relaxed">
              Não rode de baú vazio. Acesse o radar de oportunidades na sua região, escolha as melhores rotas e garanta seu pagamento de forma blindada.
            </p>
            <ul className="space-y-4 mb-10 text-slate-300 font-bold text-sm">
              <li className="flex items-center gap-3"><CheckCircle2 className="text-cyan-400 w-6 h-6"/> Oportunidades diárias no seu radar</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-cyan-400 w-6 h-6"/> Liberdade para escolher as rotas</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="text-cyan-400 w-6 h-6"/> Pagamento protegido e garantido</li>
            </ul>
            <button onClick={onDriver} className="w-full h-16 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2">
              Encontrar fretes <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

// =========================================================
// 4. BENEFÍCIOS
// =========================================================
function Benefits() {
  const benefits = [
    { icon: <Clock size={28} />, title: "Agilidade na Conexão", desc: "A plataforma faz o match entre a sua carga e os veículos disponíveis rapidamente." },
    { icon: <MapPin size={28} />, title: "Visibilidade Total", desc: "Acompanhe o status do frete desde a coleta até a confirmação de entrega." },
    { icon: <ShieldCheck size={28} />, title: "Operação Blindada", desc: "Pagamento retido via Escrow e liberado apenas após a validação do serviço." },
    { icon: <CreditCard size={28} />, title: "Sem Surpresas", desc: "Precificação transparente. O valor combinado é o valor garantido na operação." },
  ];

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-16 tracking-tight">O que a FretoGo entrega para você</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="flex flex-col items-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                {b.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">{b.title}</h3>
              <p className="text-slate-600 font-medium leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 5. COMO FUNCIONA
// =========================================================
function HowItWorks() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 tracking-tight">Como a plataforma funciona?</h2>
          <p className="text-lg text-slate-600 font-medium">Um processo organizado em etapas simples para garantir o sucesso de cada operação.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* FLUXO EMPRESA */}
          <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3 relative z-10">
              <Package className="text-blue-600" /> Para Empresas
            </h3>
            <div className="space-y-8 relative z-10">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">Publicação da Carga</h4>
                  <p className="text-slate-600">Insira a origem, destino, tipo de veículo e valor da oferta.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">Pagamento Seguro</h4>
                  <p className="text-slate-600">Ao encontrar um motorista, realize o pagamento para liberar a rota.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">Acompanhamento</h4>
                  <p className="text-slate-600">Monitore o status do deslocamento e da coleta em tempo real.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 mb-1">Confirmação (PIN e Foto)</h4>
                  <p className="text-slate-600">Receba a foto da mercadoria e forneça o PIN para validar a entrega.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FLUXO MOTORISTA */}
          <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-bl-full -z-0"></div>
            <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-3 relative z-10">
              <Truck className="text-cyan-400" /> Para Motoristas
            </h3>
            <div className="space-y-8 relative z-10">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center font-black shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Radar de Oportunidades</h4>
                  <p className="text-slate-400">Acesse o mural e encontre cargas disponíveis na sua região.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center font-black shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Aceite o Frete</h4>
                  <p className="text-slate-400">Confirme o interesse e aguarde a liberação do pagamento pelo cliente.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center font-black shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Realize o Transporte</h4>
                  <p className="text-slate-400">Desloque-se até a coleta e inicie a rota com segurança financeira.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center font-black shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">Entrega e Repasse</h4>
                  <p className="text-slate-400">Tire a foto, insira o PIN do cliente e receba o valor na sua conta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================
// 6. CONFIANÇA / SEGURANÇA
// =========================================================
function TrustSection() {
  return (
    <section className="py-24 bg-slate-900 text-white border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
              Sua operação <span className="text-cyan-400">blindada</span> de ponta a ponta.
            </h2>
            <p className="text-lg text-slate-400 font-medium mb-10 leading-relaxed">
              Desenvolvemos mecanismos rigorosos para garantir que o embarcador tenha a prova da entrega e o motorista tenha a certeza do recebimento. Sem margem para falhas.
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
// 7. CTA FINAL
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
// 8. FOOTER ESPECÍFICO DA HOME
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
        <AudienceSplit onClient={goToClient} onDriver={goToDriver} />
        <Benefits />
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
