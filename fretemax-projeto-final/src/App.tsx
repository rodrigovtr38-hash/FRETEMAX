import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Cliente from './pages/Cliente';
import Motorista from './pages/Motorista';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        
        <main className="flex-1 w-full relative">
          <Routes>
            {/* Home Institucional */}
            <Route path="/" element={<Home />} />
            
            {/* Rotas de Tráfego Pago (Podemos usar as mesmas telas com URLs amigáveis) */}
            <Route path="/preciso-de-frete" element={<Cliente />} />
            <Route path="/sou-motorista" element={<Motorista />} />

            {/* Rotas Originais */}
            <Route path="/cliente" element={<Cliente />} />
            <Route path="/motorista" element={<Motorista />} />
            <Route path="/admin" element={<Admin />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-slate-950 py-8 text-center border-t border-slate-900">
          <div className="flex justify-center gap-2 mb-4">
             <Zap className="text-yellow-400 w-4 h-4 fill-yellow-400" />
             <span className="font-black text-sm italic tracking-tighter uppercase">FRETOGO</span>
          </div>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">
            © 2026 FRETOGO TECNOLOGIA LTDA • TECNOLOGIA AUTÔNOMA DE LOGÍSTICA
          </p>
        </footer>
      </div>
    </Router>
  );
}
