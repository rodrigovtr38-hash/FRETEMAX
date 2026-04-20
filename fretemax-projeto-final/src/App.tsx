import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cliente from './pages/Cliente';
import Motorista from './pages/Motorista';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        {/* Banner de Lançamento (Opcional, se quiser manter) */}
        <div className="bg-yellow-500 text-black font-bold text-center py-2 text-[12px] uppercase tracking-widest">
          🚀 Lançamento Oficial em: 30 Dias
        </div>

        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cliente" element={<Cliente />} />
            <Route path="/motorista" element={<Motorista />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
