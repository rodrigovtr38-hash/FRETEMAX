import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Cliente from './pages/Cliente';
import Motorista from './pages/Motorista';
import { Truck } from 'lucide-react';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clicks, setClicks] = useState(0);

  const handleLogoClick = () => {
    navigate('/');
    setClicks(prev => {
      const nc = prev + 1;
      if (nc >= 5) {
        localStorage.setItem('adminMode', 'true');
        alert('Modo Admin Ativado');
        window.location.reload();
      }
      return nc;
    });
  };
  
  return (
    <header className="h-[70px] bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10">
      <div 
        className="flex items-center gap-2 cursor-pointer select-none" 
        onClick={handleLogoClick}
      >
        <Truck className="h-6 w-6 text-blue-600" />
        <div className="text-[24px] font-extrabold text-blue-600 tracking-tight">FreteMax</div>
      </div>
      <div className="flex items-center gap-4 sm:gap-6">
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          📱 Instalar Aplicativo
        </button>
        <button 
          onClick={() => navigate('/cliente')} 
          className={`text-[14px] font-medium transition-colors ${location.pathname === '/cliente' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Cliente
        </button>
        <button 
          onClick={() => navigate('/motorista')} 
          className={`text-[14px] font-medium transition-colors ${location.pathname === '/motorista' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Motorista
        </button>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <div className="bg-yellow-500 text-black font-bold text-center py-2 text-[14px]">
          🚀 Lançamento Oficial em: 30 Dias
        </div>
        <Header />
        <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cliente" element={<Cliente />} />
            <Route path="/motorista" element={<Motorista />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
