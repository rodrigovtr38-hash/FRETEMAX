// =========================================================
// NOME DO ARQUIVO: src/pages/Home.tsx
// CTO-Log: HOME-EXEC-01. Landing Page Oficial FretoGo.
// Status: Arquitetura Mobile-First, focada em Dor e Solução para B2B e Transportadores.
// Remoção de métricas irreais. Comunicação clara de Escrow e Rotas.
// =========================================================

import { Zap, Truck, ShieldCheck, ArrowRight, Building2, MapPin, CheckCircle, Package, Route, LockKeyhole, Camera, Users, DollarSign, Clock, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_LINKS, openExternalLink } from '../config/platformLinks';

export default function Home() {
  const navigate = useNavigate();

  const goToClient = () => {
    navigate('/cliente');
  };

  const goToDriver = () => {
    navigate('/motorista');
  };

  const handleWhatsAppSupport = () => {
    openExternalLink(PLATFORM_LINKS.SUPPORT_WHATSAPP);
  };

  const handleDriverGroup = () => {
    openExternalLink(PLATFORM_LINKS.DRIVER_VIP_GROUP);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600/20 overflow-x-hidden">
      
      {/* ======================================================= */}
      {/* 01 - NAVBAR */}
      {/* ======================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/50 bg-white/90 backdrop-blur-md shadow-sm">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="text-xl font-black italic tracking-tighter text-slate-900">
              FRETOGO
            </span>
          </div>
          
          {/* Links Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={goToClient} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Para Empresas</button>
            <button onClick={goToDriver} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Para Motoristas</button>
            <button onClick={handleWhatsAppSupport} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Suporte</button>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button onClick={goToDriver} className="hidden sm:flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95">
              Sou Motorista
            </button>
            <button onClick={goToClient} className="flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-xs md:text-sm font-black uppercase tracking-wider text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-95">
              Publicar Carga
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col pt-16">
        
        {/* ======================================================= */}
        {/* 02 E 03 - HERO PRINCIPAL */}
        {/* ======================================================= */}
        <section className="relative w-full bg-slate-950 overflow-hidden py-16 md:py-24 lg:py-32">
          {/* Background Animado Leve */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20"></div>
            <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[100px]"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Copy Hero */}
            <div className="w-full max-w-2xl text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Sua carga precisa chegar.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Nós encontramos quem leva.
                </span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                Publique sua carga, conecte-se com motoristas prontos para rodar e acompanhe a entrega até o comprovante final.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button onClick={goToClient} className="w-full sm:w-auto flex h-16 items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-95">
                  SOU EMPRESA — PUBLICAR CARGA <ArrowRight size={18} />
                </button>
                <button onClick={goToDriver} className="w-full sm:w-auto flex h-16 items-center justify-center gap-2 rounded-[1.5rem] border border-slate-700 bg-slate-900/50 px-8 text-sm font-black uppercase tracking-widest text-slate-300 backdrop-blur-md transition-all hover:bg-slate-800 hover:text-white active:scale-95">
                  <Truck size={18} /> SOU MOTORISTA — ENCONTRAR FRETES
                </button>
              </div>
            </div>

            {/* Elemento Visual Logístico (Abstrato e Leve) */}
            <div className="hidden lg:flex w-full justify-end relative h-[380px]">
              <div className="relative w-full max-w-md h-full rounded-[2rem] border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 shadow-2xl overflow-hidden flex flex-col justify-between">
                
                {/* Rota Topo */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rastreamento Ativo</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Em Trânsito</p>
                  </div>
                </div>

                {/* Gráfico de Linha de Rota */}
                <div className="relative flex-grow my-6 mx-4 border-l-2 border-dashed border-slate-700 py-4 flex flex-col justify-between">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-slate-900 bg-blue-500"></div>
                  <div className="absolute -left-[9px] bottom-0 h-4 w-4 rounded-full border-4 border-slate-900 bg-amber-500"></div>
                  
                  <div className="pl-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Origem</p>
                    <p className="text-sm font-bold text-white mt-1">Centro de Distribuição</p>
                  </div>
                  
                  {/* Veículo (Ícone) */}
                  <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 bg-slate-800 p-2 rounded-xl border border-slate-700 text-white shadow-lg">
                    <Truck size={20} />
                  </div>

                  <div className="pl-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destino</p>
                    <p className="text-sm font-bold text-white mt-1">Cliente Final</p>
                  </div>
                </div>

                {/* Status Inferior */}
                <div className="bg-slate-950 rounded-2xl p-4 flex items-center justify-between border border-slate-800">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carga Protegida</p>
                    <p className="text-lg font-black text-emerald-400 mt-0.5">Operação Segura</p>
                  </div>
                  <ShieldCheck className="text-slate-600 w-8 h-8" />
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 04 - DOR DA EMPRESA */}
      {/* ======================================================= */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="mb-4 inline-block rounded-lg bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                Para Empresas e Embarcadores
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Tem uma entrega para fazer?
              </h2>
              <p className="text-lg text-slate-600 font-medium mb-6 leading-relaxed">
                Carga parada, dificuldade para encontrar motorista disponível e falta de visibilidade são problemas reais. Não deixe uma venda parada esperando transporte.
              </p>
              <p className="text-lg text-slate-600 font-medium mb-10 leading-relaxed">
                A FretoGo ajuda a organizar sua operação. A plataforma considera distância, veículo, pedágios e características da operação para sugerir a oferta ideal, conectando você ao motorista de forma transparente.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />
                  <span className="font-bold text-slate-800 text-sm">Menos carga parada</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />
                  <span className="font-bold text-slate-800 text-sm">Controle da operação</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />
                  <span className="font-bold text-slate-800 text-sm">Acompanhamento</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <CheckCircle className="text-emerald-500 w-5 h-5 shrink-0" />
                  <span className="font-bold text-slate-800 text-sm">Entrega comprovada</span>
                </div>
              </div>

              <button onClick={goToClient} className="flex h-14 w-full sm:w-max px-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 active:scale-95">
                Publicar meu frete
              </button>
            </div>
            
            {/* Como Funciona (Empresa) */}
            <div className="bg-slate-50 rounded-[2rem] p-8 lg:p-12 border border-slate-200">
              <h3 className="text-xl font-black text-slate-900 mb-8">Fluxo Operacional</h3>
              <div className="flex flex-col gap-4 relative z-10">
                <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 border border-slate-100">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Package size={20}/></div>
                  <div><p className="font-bold text-slate-900">Publicar</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 ml-4 border border-slate-100">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Search size={20}/></div>
                  <div><p className="font-bold text-slate-900">Encontrar</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 ml-8 border border-slate-100">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Route size={20}/></div>
                  <div><p className="font-bold text-slate-900">Acompanhar</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 ml-12 border border-slate-100">
                  <div className="bg-emerald-50 p-3 rounded-full text-emerald-500"><CheckCircle size={20}/></div>
                  <div><p className="font-bold text-slate-900">Entregar</p></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 05 - DOR DO MOTORISTA */}
      {/* ======================================================= */}
      <section className="py-20 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Como Funciona (Motorista) */}
            <div className="order-2 lg:order-1 bg-slate-800/50 border border-slate-700 rounded-[2rem] p-8 lg:p-12">
               <div className="flex flex-col gap-4">
                 <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                   <div className="bg-slate-800 p-3 rounded-full text-slate-400"><MapPin size={20} /></div>
                   <div><p className="text-[10px] font-black uppercase text-slate-500">Destino</p><p className="font-bold text-white">Informe para onde você vai</p></div>
                 </div>
                 <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4 ml-4">
                   <div className="bg-cyan-900/30 p-3 rounded-full text-cyan-400"><Map size={20} /></div>
                   <div><p className="text-[10px] font-black uppercase text-cyan-500">Busca</p><p className="font-bold text-white">Encontre fretes compatíveis</p></div>
                 </div>
                 <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center gap-4 ml-8">
                   <div className="bg-emerald-900/30 p-3 rounded-full text-emerald-400"><DollarSign size={20} /></div>
                   <div><p className="text-[10px] font-black uppercase text-emerald-500">Fechamento</p><p className="font-bold text-white">Pagamento conforme regra</p></div>
                 </div>
               </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-block rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Para Transportadores
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                Tem uma rota para fazer?
              </h2>
              <p className="text-lg text-slate-400 font-medium mb-6 leading-relaxed">
                Voltar com o baú vazio ou perder tempo procurando carga consome a sua margem de lucro na estrada.
              </p>
              <p className="text-lg text-slate-400 font-medium mb-10 leading-relaxed">
                Veja se existe uma carga que combina com o seu caminho. Na plataforma, você pode encontrar oportunidades pelo seu destino desejado. Após concluir a entrega e o comprovante, o pagamento entra no fluxo de pagamento da FretoGo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={goToDriver} className="flex h-14 w-full sm:w-auto items-center justify-center px-10 rounded-xl bg-cyan-500 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-cyan-400 active:scale-95">
                  Encontrar fretes
                </button>
                <button onClick={handleDriverGroup} className="flex h-14 w-full sm:w-auto items-center justify-center px-6 rounded-xl border border-slate-700 bg-transparent text-sm font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-slate-800 active:scale-95 gap-2">
                  <Users size={18} /> Entrar no grupo
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 07 - SEGURANÇA E CONTROLE DA ENTREGA */}
      {/* ======================================================= */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4 inline-block rounded-lg bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
            Segurança Operacional
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">Entrega comprovada.</h2>
          <p className="mt-4 text-slate-600 font-medium text-lg max-w-2xl mx-auto mb-16">
            A plataforma possui ferramentas nativas para assegurar a custódia, o acompanhamento e o rastreamento da operação até o destino.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4"><LockKeyhole size={24} /></div>
              <h4 className="font-bold text-slate-900 mb-2">PIN</h4>
              <p className="text-sm text-slate-500 font-medium">Validação segura na ponta.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4"><Camera size={24} /></div>
              <h4 className="font-bold text-slate-900 mb-2">Foto da entrega</h4>
              <p className="text-sm text-slate-500 font-medium">Registro visual e documental.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4"><Route size={24} /></div>
              <h4 className="font-bold text-slate-900 mb-2">Acompanhamento</h4>
              <p className="text-sm text-slate-500 font-medium">Monitoramento do transporte.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4"><Clock size={24} /></div>
              <h4 className="font-bold text-slate-900 mb-2">Histórico</h4>
              <p className="text-sm text-slate-500 font-medium">Dados preservados da operação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 09 - CTA FINAL (EMPRESA E MOTORISTA) */}
      {/* ======================================================= */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            
            <div className="bg-blue-600 p-10 rounded-[2rem] text-center flex flex-col items-center justify-center shadow-xl">
              <h3 className="text-2xl font-black text-white mb-3">Sua carga não pode esperar.</h3>
              <p className="text-blue-100 mb-8 font-medium">Cadastre-se na FretoGo e coloque sua mercadoria na rua.</p>
              <button onClick={goToClient} className="bg-white text-blue-600 w-full sm:w-auto px-10 h-14 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-colors active:scale-95">
                Publicar uma carga
              </button>
            </div>

            <div className="bg-slate-900 p-10 rounded-[2rem] text-center flex flex-col items-center justify-center shadow-xl">
              <h3 className="text-2xl font-black text-white mb-3">Sua rota pode render mais.</h3>
              <p className="text-slate-400 mb-8 font-medium">Conecte-se às melhores cargas e não rode de baú vazio.</p>
              <button onClick={goToDriver} className="bg-cyan-500 text-slate-950 w-full sm:w-auto px-10 h-14 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors active:scale-95">
                Encontrar fretes
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 10 - FOOTER */}
      {/* ======================================================= */}
      <footer className="bg-slate-950 text-slate-400 py-16 mt-auto border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
            
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-slate-800 p-1.5 rounded-lg">
                  <Zap className="h-5 w-5 fill-white text-white" />
                </div>
                <span className="text-xl font-black italic tracking-tighter text-white">
                  FRETOGO
                </span>
              </div>
              <p className="text-sm font-medium leading-relaxed pr-4 text-slate-400">
                Logística que conecta quem precisa entregar a quem pode levar.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6">Empresas</h4>
              <ul className="space-y-4">
                <li><button onClick={goToClient} className="text-sm font-medium hover:text-white transition-colors">Publicar frete</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6">Motoristas</h4>
              <ul className="space-y-4">
                <li><button onClick={goToDriver} className="text-sm font-medium hover:text-white transition-colors">Encontrar fretes</button></li>
                <li><button onClick={handleDriverGroup} className="text-sm font-medium hover:text-white transition-colors">Grupo de motoristas</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white mb-6">Suporte</h4>
              <ul className="space-y-4">
                <li><button onClick={handleWhatsAppSupport} className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">WhatsApp</button></li>
                <li className="text-sm font-medium text-slate-400">contato@fretogo.com.br</li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
              <p className="text-xs font-medium text-slate-500">
                FretoGo
              </p>
              <p className="text-xs font-medium text-slate-500">
                CNPJ: 64.172.243/0001-90
              </p>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 text-center">
              © {new Date().getFullYear()} FretoGo — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

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
