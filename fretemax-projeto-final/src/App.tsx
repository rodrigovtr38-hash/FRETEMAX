import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Cliente from './pages/Cliente';
import Motorista from './pages/Motorista';
import Admin from './pages/Admin'; // IMPORTANDO SUA NOVA TORRE DE COMANDO

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        
        {/* Banner de Lançamento Estratégico */}
        <div className="bg-yellow-500 text-black font-black text-center py-2 text-[10px] uppercase tracking-[0.2em] shadow-lg z-[100]">
          🚀 Lançamento Oficial em: 30 Dias
        </div>

        <main className="flex-1 w-full relative">
          <Routes>
            {/* Rota Principal */}
            <Route path="/" element={<Home />} />
            
            {/* Rota do Cliente (Checkout e Radar) */}
            <Route path="/cliente" element={<Cliente />} />
            
            {/* Rota do Motorista (Radar e Ganho de 80%) */}
            <Route path="/motorista" element={<Motorista />} />
            
            {/* SUA NOVA ROTA DE ADMIN (SALA DE GUERRA) */}
            <Route path="/admin" element={<Admin />} />

            {/* REDIRECIONAMENTO DE SEGURANÇA: Se digitar errado, volta pra Home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Rodapé Simples para dar corpo ao App no Celular */}
        <footer className="bg-slate-900/50 py-4 text-center border-t border-slate-800">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            © 2026 FRETOGO TECNOLOGIA LTDA
          </p>
        </footer>
      </div>
    </Router>
  );
}
