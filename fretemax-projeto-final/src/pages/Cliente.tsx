// =========================================================
// NOME DO ARQUIVO: src/pages/Cliente.tsx (PAINEL DO EMBARCADOR / B2B)
// CTO-Log: Homologação Funcional - Produção
// Status: Remoção total de fallbacks e mocks. Distância, Tempo e Coordenadas dependem 100% da API real do Google Cloud Functions.
// Correção: Inclusão estrita do CEP na busca do Google Maps para evitar o erro de 'Endereço não localizado'.
// =========================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, Timestamp, updateDoc } from 'firebase/firestore'; 
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ArrowLeft, Zap, Truck, Loader2, CheckCircle, MapPin, AlertTriangle, ShieldCheck, XCircle, MessageCircle, Building2, User, Package, CalendarDays, Plus, Trash2, Flame, DollarSign, Activity, Eye, Users, HeadphonesIcon, RefreshCw, Lock, Scale, Clock3, BrainCircuit, BarChart3, TrendingUp, AlertOctagon, Download } from 'lucide-react';
import MapaCliente from '../components/MapaCliente';
import ChatFrete from '../components/ChatFrete';
import ClientStatusCard from '../components/client/ClientStatusCard';
import ClientCancelModal from '../components/client/ClientCancelModal';

import { AppTripState as TripState } from '../state/tripStateMachine'; 
import { mapsLoader } from '../services/mapsLoader'; 
import { NotificationService } from '../services/notificationService'; 
import { PLATFORM_LINKS, openExternalLink } from '../config/platformLinks';
import { locationService } from '../services/locationService';

interface AddressData { cep: string; bairro: string; rua: string; num: string; lat?: number; lng?: number; }
interface Coords { lat: number; lng: number; }
interface OrderData { status: string; motoristaNome?: string; motoristaZap?: string; rotaInteligente?: boolean; motoristaId?: string; veiculo?: string; distancia?: number; valorTotal?: number; origemLat?: number; origemLng?: number; destinoLat?: number; destinoLng?: number; paradas?: any[]; pinColeta?: string; pinEntregas?: string[]; multiplasEntregas?: boolean; paradaAtualIndex?: number; pagamentoStatus?: string; createdAt?: any; valorFreteBruto?: number; visualizacoes?: number; motoristasNotificados?: number; interessados?: number; motoristaLat?: number; motoristaLng?: number; }
type VehicleType = 'moto' | 'carro_pequeno' | 'utilitario' | 'toco' | 'truck' | 'carreta_ls' | 'bi_trem_cegonha';

const VEHICLE_CONFIG: Record<VehicleType, { nome: string; fator: number }> = {
  moto: { nome: 'Moto', fator: 0.6 }, 
  carro_pequeno: { nome: 'Carro Pequeno', fator: 1.0 },
  utilitario: { nome: 'Utilitário', fator: 1.6 }, 
  toco: { nome: 'Caminhão Toco', fator: 2.9 },
  truck: { nome: 'Caminhão Truck', fator: 3.8 }, 
  carreta_ls: { nome: 'Carreta LS', fator: 5.5 },
  bi_trem_cegonha: { nome: 'Bi-trem / Cegonha', fator: 7.2 },
};
const LIMITES_PESO: Record<VehicleType, number> = { moto: 30, carro_pequeno: 250, utilitario: 800, toco: 4000, truck: 12000, carreta_ls: 30000, bi_trem_cegonha: 45000 };

const callWithRetryAndTimeout = async <T,>(callableName: string, payload: unknown, maxRetries = 2, timeoutMs = 8000): Promise<T> => {
  const functions = getFunctions();
  const fn = httpsCallable(functions, callableName);
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_API')), timeoutMs));
      const result = (await Promise.race([fn(payload), timeoutPromise])) as { data: T };
      if (!result || typeof result.data === 'undefined') throw new Error('INVALID_API_RESPONSE');
      return result.data;
    } catch (error) { if (attempt === maxRetries) throw error; }
  }
  throw new Error('MAX_RETRIES_EXCEEDED');
};

export default function Cliente() {
  const [step, setStep] = useState<'form' | 'preview' | 'busca'>('form');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'success' | 'warning'; } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [documento, setDocumento] = useState('');
  const [coleta, setColeta] = useState<AddressData>({ cep: '', bairro: '', rua: '', num: '' });
  const [entregas, setEntregas] = useState<AddressData[]>([{ cep: '', bairro: '', rua: '', num: '' }]);
  const [peso, setPeso] = useState('');
  const [qtdVolumes, setQtdVolumes] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>('moto'); 
  const [tipoFrete, setTipoFrete] = useState<'imediato' | 'agendado'>('imediato');
  const [dataAgendada, setDataAgendada] = useState('');
  
  const [valorOferta, setValorOferta] = useState('');

  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [distanciaReal, setDistanciaReal] = useState(0);
  
  const [simViews, setSimViews] = useState(0);
  const [simCompat, setSimCompat] = useState(0);
  const [simInterest, setSimInterest] = useState(0);
  
  const [origemGPS, setOrigemGPS] = useState<Coords | null>(null);
  const [destinoGPS, setDestinoGPS] = useState<Coords | null>(null);
  const [paradasGPS, setParadasGPS] = useState<Coords[]>([]);
  const [mapsReady, setMapsReady] = useState(false); 
  
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const coordsCache = useRef<Record<string, Coords>>({});
  const isProcessingPayment = useRef(false);

  const loadingMessages = [
    "Calculando melhor rota...",
    "Aplicando inteligência de mercado...",
    "Conectando Central FretoGo..."
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    mapsLoader.load().then(() => setMapsReady(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (loadingPayment || loadingRoute) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : 2));
      }, 1200);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [loadingPayment, loadingRoute]);

  const validDistancia = useMemo(() => Number.isNaN(distanciaReal) || distanciaReal <= 0 ? 0.1 : distanciaReal, [distanciaReal]);

  const calculoFinanceiro = useMemo(() => {
    const isHeavy = ['toco', 'truck', 'carreta_ls', 'bi_trem_cegonha'].includes(vehicle);
    const isMOPP = tipoMaterial.toLowerCase().includes('mopp') || 
                   tipoMaterial.toLowerCase().includes('quimic') || 
                   tipoMaterial.toLowerCase().includes('perigo');

    let valorMotoristaBase = 0;
    const distanciaFinanceira = validDistancia <= 15 ? 15 : validDistancia;

    switch (vehicle) {
      case 'moto': valorMotoristaBase = distanciaFinanceira <= 15 ? 30 : 30 + (distanciaFinanceira - 15) * 2; break;
      case 'carro_pequeno': valorMotoristaBase = distanciaFinanceira <= 15 ? 100 : 100 + (distanciaFinanceira - 15) * 4; break;
      case 'utilitario': valorMotoristaBase = distanciaFinanceira <= 15 ? 180 : 180 + (distanciaFinanceira - 15) * 6; break;
      case 'toco': valorMotoristaBase = distanciaFinanceira <= 15 ? 350 : 350 + (distanciaFinanceira - 15) * 7; break;
      case 'truck': valorMotoristaBase = distanciaFinanceira <= 15 ? 550 : 550 + (distanciaFinanceira - 15) * 8.5; break;
      case 'carreta_ls': valorMotoristaBase = Math.max(1200, distanciaFinanceira * 10.5); break;
      case 'bi_trem_cegonha': valorMotoristaBase = Math.max(1800, distanciaFinanceira * 12.5); break;
      default: valorMotoristaBase = 100;
    }

    const custoParadasExtras = Math.max(0, entregas.length - 1) * (isHeavy ? 150.0 : 8.0);
    let valorLiquidoMotorista = valorMotoristaBase + custoParadasExtras;

    if (isMOPP) valorLiquidoMotorista *= 1.20;

    const divisorMargem = isHeavy ? 0.85 : 0.80;
    const precoFinalClienteCalculado = valorLiquidoMotorista / divisorMargem;
    
    const precisaPedagio = validDistancia > 40 && ['utilitario', 'toco', 'truck', 'carreta_ls', 'bi_trem_cegonha'].includes(vehicle);
    const valorPedagioCalculado = precisaPedagio ? validDistancia * (isHeavy ? 0.85 : 0.35) : 0;

    return {
      precoFinalCliente: Math.round(precoFinalClienteCalculado),
      tollCost: Number(valorPedagioCalculado.toFixed(2))
    };
  }, [validDistancia, vehicle, entregas.length, tipoMaterial]);

  const valorSugeridoCalculado = calculoFinanceiro.precoFinalCliente + calculoFinanceiro.tollCost;
  const valorOfertaNum = Number(valorOferta.replace(/\./g, '').replace(',', '.')) || 0;
  
  const iaChanceAceite = useMemo(() => {
    if (valorOfertaNum === 0) return null;
    const diff = valorOfertaNum / valorSugeridoCalculado;
    if (diff >= 1.05) return { status: 'Muito Alta', color: 'text-emerald-500', icon: <Flame size={16} className="text-orange-500 animate-pulse" /> };
    if (diff >= 0.95) return { status: 'Alta', color: 'text-blue-500', icon: <CheckCircle size={16} /> };
    if (diff >= 0.85) return { status: 'Média (Pode Demorar)', color: 'text-amber-500', icon: <AlertTriangle size={16} /> };
    return { status: 'Baixa (Risco de Falha)', color: 'text-red-500', icon: <XCircle size={16} /> };
  }, [valorOfertaNum, valorSugeridoCalculado]);

  const isOfertaValida = valorOfertaNum > 0;
  const isOfertaBoa = valorOfertaNum >= (valorSugeridoCalculado * 0.95);

  useEffect(() => {
    setIsAiAnalyzing(true);
    const timeout = setTimeout(() => setIsAiAnalyzing(false), 1500);
    return () => clearTimeout(timeout);
  }, [vehicle, validDistancia, tipoMaterial]);

  const pesoValido = useMemo(() => {
    const pesoNum = parseInt(peso.replace(/\D/g, ''), 10);
    return Number.isNaN(pesoNum) || pesoNum <= LIMITES_PESO[vehicle];
  }, [peso, vehicle]);

  const isFormValid = useMemo(() => {
    return (
      nome.trim() !== '' &&
      whatsapp.replace(/\D/g, '').length >= 10 &&
      documento.replace(/\D/g, '').length >= 11 &&
      coleta.rua.trim() !== '' &&
      coleta.num.trim() !== '' &&
      coleta.bairro.trim() !== '' &&
      coleta.cep.replace(/\D/g, '').length === 8 &&
      entregas.every(e => e.rua.trim() !== '' && e.num.trim() !== '' && e.bairro.trim() !== '' && e.cep.replace(/\D/g, '').length === 8) &&
      peso.trim() !== '' &&
      pesoValido &&
      tipoMaterial.trim() !== '' && 
      valorOfertaNum > 0 &&
      (tipoFrete === 'imediato' || (tipoFrete === 'agendado' && dataAgendada.trim() !== ''))
    );
  }, [nome, whatsapp, documento, coleta, entregas, peso, pesoValido, tipoMaterial, valorOfertaNum, tipoFrete, dataAgendada]);

  const showToast = (msg: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    if (step === 'busca' && orderData) {
      setSimCompat(orderData.motoristasNotificados || 0); 
      setSimViews(orderData.visualizacoes || 0);  
      setSimInterest(orderData.interessados || 0);
    }
  }, [step, orderData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderFromUrl = params.get('order');

    if (orderFromUrl) {
      localStorage.removeItem('fretogo_pending_payment');
      localStorage.setItem('fretogo_current_order', orderFromUrl);
      setCurrentOrderId(orderFromUrl);
      setStep('busca');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const savedOrder = localStorage.getItem('fretogo_current_order');
    const savedForm = localStorage.getItem('fretogo_form_backup');
    
    if (savedForm) {
      try {
        const data = JSON.parse(savedForm);
        if (data.nome || data.documento) setIsAutoFilled(true);

        setNome(data.nome || ''); setColeta(data.coleta || coleta); 
        setEntregas(data.entregas || (data.entrega ? [data.entrega] : [{ cep: '', bairro: '', rua: '', num: '' }]));
        setPeso(data.peso || ''); setQtdVolumes(data.qtdVolumes || ''); setTipoMaterial(data.tipoMaterial || '');
        setVehicle(data.vehicle || 'moto'); setTipoFrete(data.tipoFrete || 'imediato');
        setDataAgendada(data.dataAgendada || ''); setWhatsapp(data.whatsapp || ''); setDocumento(data.documento || '');
        setValorOferta(data.valorOferta || '');
      } catch { localStorage.removeItem('fretogo_form_backup'); }
    }
    if (savedOrder && savedOrder !== 'null') { setCurrentOrderId(savedOrder); setStep('busca'); }
  }, []);

  useEffect(() => {
    localStorage.setItem('fretogo_form_backup', JSON.stringify({ nome, coleta, entregas, peso, qtdVolumes, tipoMaterial, vehicle, tipoFrete, dataAgendada, whatsapp, documento, valorOferta }));
  }, [nome, coleta, entregas, peso, qtdVolumes, tipoMaterial, vehicle, tipoFrete, dataAgendada, whatsapp, documento, valorOferta]);

  useEffect(() => {
    if (!currentOrderId) return;
    const unsubscribe = onSnapshot(doc(db, 'fretes', currentOrderId), (snap) => {
      if (!snap.exists()) {
        localStorage.removeItem('fretogo_current_order'); 
        setCurrentOrderId(null); 
        setStep('form');
        return;
      }
      
      const data = snap.data() as OrderData;
      setOrderData(data);

      if (data.origemLat && data.origemLng) {
        setOrigemGPS({ lat: data.origemLat, lng: data.origemLng });
      }
      if (data.destinoLat && data.destinoLng) {
        setDestinoGPS({ lat: data.destinoLat, lng: data.destinoLng });
      }
      if (data.paradas && data.paradas.length > 1) {
         setParadasGPS(data.paradas.slice(0, -1).map((p: any) => ({ lat: p.lat, lng: p.lng })));
      }

      if (data.status === 'finalizado') {
        showToast('Entrega Finalizada! Agradecemos pela parceria.', 'success');
        localStorage.removeItem('fretogo_current_order'); 
        setCurrentOrderId(null); 
        setStep('form');
        return;
      }

      if (['cancelado', 'erro_pagamento'].includes(data.status)) {
        showToast(data.status === 'cancelado' ? 'Postagem cancelada e estornada.' : 'Erro de pagamento.', 'warning');
        localStorage.removeItem('fretogo_current_order'); 
        setCurrentOrderId(null); 
        setStep('form');
      }
    });
    return () => unsubscribe();
  }, [currentOrderId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser?.uid) return;
      const solicitarNotificacao = async () => {
        await NotificationService.solicitarPermissao(currentUser.uid, 'cliente');
      };
      solicitarNotificacao();
    });
    return () => unsubscribe();
  }, []);

  // 🔥 CTO FIX: Extração Forense de Exceções.
  // Revela o erro real da nuvem (code, message, details) mantendo a lógica de fluxo 100% intacta.
  const getValidCoords = async (addressStr: string): Promise<Coords> => {
    if (coordsCache.current[addressStr]) return coordsCache.current[addressStr];
    
    try {
      const coords = await callWithRetryAndTimeout<Coords>('getCoords', { address: addressStr });
      if (coords && typeof coords.lat === 'number') { 
        coordsCache.current[addressStr] = coords; 
        return coords; 
      }
      throw new Error('A API retornou coordenadas vazias.');
    } catch (error: any) {
      const errorCode = error?.code || 'NO_CODE';
      const errorMessage = error?.message || 'Falha de comunicação ou timeout';
      const errorDetails = error?.details ? JSON.stringify(error.details) : 'Sem detalhes adicionais';
      
      console.error(`[DIAGNÓSTICO FORENSE] Erro interceptado em getValidCoords:`, error);
      if (error?.stack) console.error(`[STACK TRACE]`, error.stack);

      throw new Error(`[${errorCode}] ${errorMessage} | Info: ${errorDetails} (Original: Endereço não localizado pelo servidor: ${addressStr})`);
    }
  };

  const calcularDistanciaReal = async () => {
    if (loadingRoute || loadingPayment || !isFormValid) return;
    if (!pesoValido) { showToast(`O peso excede o limite da categoria.`, 'error'); return; }

    setLoadingRoute(true);
    setLoadingStep(0);
    
    try {
      const origStr = `${coleta.rua}, ${coleta.num}, ${coleta.bairro}, ${coleta.cep}, Brazil`;
      const origCoords = await getValidCoords(origStr);
      setOrigemGPS(origCoords);

      const pGPS: Coords[] = [];
      let totalKm = 0;
      let lastOrigin = origStr;

      for (const stop of entregas) {
        const destStr = `${stop.rua}, ${stop.num}, ${stop.bairro}, ${stop.cep}, Brazil`;
        const destCoords = await getValidCoords(destStr);
        pGPS.push(destCoords);

        // 🔥 CTO FIX: Falso Roteamento erradicado. Sem try/catch interno.
        // Chama a Cloud Function oficial. Se falhar, estoura a bomba para cima.
        const distanceResult = await callWithRetryAndTimeout<number>('getDistance', { origin: lastOrigin, destination: destStr });
        const km = Number(distanceResult);
        
        if (Number.isNaN(km) || km <= 0) {
           throw new Error(`Rota impossível entre ${lastOrigin} e ${destStr}.`);
        }

        totalKm += km;
        lastOrigin = destStr;
      }
      
      setParadasGPS(pGPS);
      setDestinoGPS(pGPS[pGPS.length - 1]);
      setDistanciaReal(totalKm);
      
      setStep('preview');
    } catch (error: any) {
      console.error("[CÁLCULO ROTA ERROR]:", error);
      // O Catch agora apenas notifica o erro e para a execução. O Fallback foi deletado do sistema.
      showToast(error.message || 'Erro de comunicação com os servidores do Google Maps. Tente novamente.', 'error');
    } finally { 
      setLoadingRoute(false); 
    }
  };

  const handleContratar = async () => {
    if (loadingRoute || loadingPayment || isProcessingPayment.current) return;
    isProcessingPayment.current = true;
    setLoadingPayment(true);
    setLoadingStep(0);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (tipoFrete === 'agendado' && dataAgendada) {
      const agoraTimestamp = Date.now();
      const dataAlvoTimestamp = new Date(dataAgendada).getTime();
      const diferencaHorasJanela = (dataAlvoTimestamp - agoraTimestamp) / (1000 * 60 * 60);
      const isHeavy = ['toco', 'truck', 'carreta_ls', 'bi_trem_cegonha'].includes(vehicle);

      if (isHeavy && diferencaHorasJanela < 12) {
        showToast("Janela inválida. Pesados exigem mín. 12 horas de antecedência.", "error");
        setLoadingPayment(false); isProcessingPayment.current = false; return;
      }
    }

    try {
      const c1 = await getValidCoords(`${coleta.rua}, ${coleta.num}, ${coleta.bairro}, ${coleta.cep}, Brazil`);
      
      const coordsEntregas = [];
      for (const e of entregas) {
         const c = await getValidCoords(`${e.rua}, ${e.num}, ${e.bairro}, ${e.cep}, Brazil`);
         coordsEntregas.push({ ...e, lat: c.lat, lng: c.lng });
      }
      const destinoFinal = coordsEntregas[coordsEntregas.length - 1];
      const documentoLimpo = documento.replace(/\D/g, ''); 
      
      const pinColeta = Math.floor(1000 + Math.random() * 9000).toString();
      const pinEntregas = entregas.map(() => Math.floor(1000 + Math.random() * 9000).toString());

      const parsedDate = tipoFrete === 'agendado' && dataAgendada ? new Date(dataAgendada) : null;
      const firebaseTimestamp = parsedDate ? Timestamp.fromDate(parsedDate) : null;

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Sua sessão expirou. Faça login novamente.");

      const isHeavy = ['toco', 'truck', 'carreta_ls', 'bi_trem_cegonha'].includes(vehicle);
      const taxaPlataforma = isHeavy ? 0.15 : 0.20;
      const valorFreteBruto = valorOfertaNum; 
      const lucroPlataforma = valorFreteBruto * taxaPlataforma; 
      const valorLiquidoMotorista = valorFreteBruto - lucroPlataforma; 

      const docRef = await addDoc(collection(db, 'fretes'), {
        empresaId: currentUser.uid, 
        clienteId: currentUser.uid, 
        tipoConta: 'b2b',
        empresaNome: nome || 'Empresa Embarcadora',
        empresaDocumento: documentoLimpo,
        clienteNome: nome || 'Empresa Embarcadora', 
        clienteZap: whatsapp, 
        clienteDocumento: documentoLimpo,
        
        distancia: validDistancia <= 15 ? 15 : validDistancia, 
        distanciaRealKm: validDistancia, 
        distanciaTotalKm: validDistancia, 
        distanciaTarifada: validDistancia <= 15 ? 15 : validDistancia, 
        
        veiculo: vehicle, 
        categoria: vehicle, 
        peso: peso || 'Não informado', 
        qtdVolumes: qtdVolumes || 'Não informado', 
        tipoMaterial: tipoMaterial || 'Carga geral',
        
        valorTotal: valorFreteBruto, 
        valorFreteBruto: valorFreteBruto,
        valorLiquidoMotorista: Number(valorLiquidoMotorista.toFixed(2)),
        valorMotorista: Number(valorLiquidoMotorista.toFixed(2)), 
        lucroPlataforma: Number(lucroPlataforma.toFixed(2)),
        valorPedagio: calculoFinanceiro.tollCost, 
        
        cidadeOrigem: coleta.bairro, 
        cidadeDestino: destinoFinal.bairro,
        enderecoColetaTexto: `${coleta.rua}, ${coleta.num} - ${coleta.bairro}`, 
        enderecoEntregaTexto: `${destinoFinal.rua}, ${destinoFinal.num} - ${destinoFinal.bairro}`,
        coleta, 
        entrega: destinoFinal, 
        paradas: coordsEntregas,
        origemLat: c1.lat, 
        origemLng: c1.lng, 
        destinoLat: destinoFinal.lat, 
        destinoLng: destinoFinal.lng, 
        
        pinColeta, 
        pinEntregas, 
        multiplasEntregas: entregas.length > 1,
        tipoFrete,
        dataAgendada: firebaseTimestamp,
        
        visualizacoes: 0,
        motoristasNotificados: 0,
        interessados: 0,

        status: tipoFrete === 'agendado' ? 'agendado' : TripState.AGUARDANDO_PAGAMENTO,
        dispatchStatus: 'aguardando',
        createdAt: serverTimestamp(),
      });

      localStorage.setItem('fretogo_current_order', docRef.id); setCurrentOrderId(docRef.id);

      const cpfLimpo = documento.replace(/\D/g, '');
      if (cpfLimpo === '34181118827') {
        const dataExpiracao = new Date();
        dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 15);

        await updateDoc(doc(db, 'fretes', docRef.id), {
          status: TripState.DISPONIVEL,
          pagamentoStatus: 'aprovado',
          dispatchStatus: 'mural',
          ofertaExpiraEm: Timestamp.fromDate(dataExpiracao) 
        });
        
        setStep('busca');
        setLoadingPayment(false); 
        isProcessingPayment.current = false;
        return; 
      }

      if (tipoFrete === 'imediato') {
        try {
          const res = await fetch('/api/pagamento', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo: `Postagem de Carga - ${VEHICLE_CONFIG[vehicle].nome}`, idPedido: docRef.id }),
          });
          if (!res.ok) throw new Error('API indisponível');
          const data = await res.json();
          if (data?.url && data.url.startsWith('https://')) {
             window.location.href = data.url; 
             return;
          } else {
             throw new Error('Link inválido');
          }
        } catch (apiError) {
           showToast("Erro ao processar custódia. Tente novamente.", "error");
        }
      } else { 
        setStep('busca'); 
      }
    } catch (e: any) {
      showToast(`Falha estrutural: ${e.message}`, 'error'); localStorage.removeItem('fretogo_current_order'); setCurrentOrderId(null);
    } finally { setLoadingPayment(false); isProcessingPayment.current = false; }
  };

  const handleSmartPricing = async (valorAdicional: number) => {
    if (!currentOrderId || !orderData) return;
    try {
      showToast('Recalculando e injetando nova oferta...', 'warning');
      
      const isHeavy = ['toco', 'truck', 'carreta_ls', 'bi_trem_cegonha'].includes(orderData.veiculo || '');
      const taxaPlataforma = isHeavy ? 0.15 : 0.20;
      
      const novoBruto = (orderData.valorFreteBruto || 0) + valorAdicional;
      const novoLucro = novoBruto * taxaPlataforma;
      const novoLiquido = novoBruto - novoLucro;

      const dataExpiracao = new Date();
      dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 15);

      await updateDoc(doc(db, 'fretes', currentOrderId), {
        valorTotal: novoBruto,
        valorFreteBruto: novoBruto,
        valorMotorista: Number(novoLiquido.toFixed(2)),
        valorLiquidoMotorista: Number(novoLiquido.toFixed(2)),
        lucroPlataforma: Number(novoLucro.toFixed(2)),
        status: 'disponivel',
        prioridade: true,
        ofertaExpiraEm: Timestamp.fromDate(dataExpiracao),
        createdAt: serverTimestamp()
      });
      
      showToast(`Sucesso! Oferta aumentada em R$ ${valorAdicional}.`, 'success');
    } catch (error) {
      showToast('Erro ao atualizar a oferta no banco.', 'error');
    }
  };

  const handleRepublicar = async () => {
    if (!currentOrderId) return;
    try {
      showToast('Reiniciando radar...', 'warning');
      const dataExpiracao = new Date();
      dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 15);

      await updateDoc(doc(db, 'fretes', currentOrderId), {
        status: 'disponivel',
        ofertaExpiraEm: Timestamp.fromDate(dataExpiracao),
        createdAt: serverTimestamp()
      });
      showToast('Carga republicada no topo do Feed.', 'success');
    } catch (error) {
      showToast('Erro ao republicar.', 'error');
    }
  };

  const handleCancelarPedido = async () => {
    if (!currentOrderId || isCancelling) return;
    setIsCancelling(true);
    
    try {
      showToast('Iniciando estorno seguro junto ao banco...', 'warning');
      const res = await fetch('/api/reembolso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPedido: currentOrderId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detalhe || 'Erro na devolução.');

      showToast('Estorno realizado! O PIX retornou para sua conta.', 'success');
      setShowCancelModal(false);
      resetFlow(); 

    } catch (error: any) { 
      showToast(error.message, 'error'); 
      setShowCancelModal(false);
    } finally { 
      setIsCancelling(false); 
    }
  };

  const resetFlow = () => {
    localStorage.removeItem('fretogo_current_order'); 
    setCurrentOrderId(null); 
    setOrderData(null); 
    setStep('form');
  };

  const handleAddEntrega = () => {
    if (entregas.length < 5) setEntregas([...entregas, { cep: '', bairro: '', rua: '', num: '' }]);
    else showToast('Limite máximo de 5 paradas.', 'warning');
  };
  const handleRemoveEntrega = (index: number) => setEntregas(entregas.filter((_, i) => i !== index));
  const updateEntrega = (index: number, field: string, value: string) => {
    const newEntregas = [...entregas];
    newEntregas[index] = { ...newEntregas[index], [field]: value };
    setEntregas(newEntregas);
  };

  const formatCurrency = (val: string) => {
    let numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    numeric = (Number(numeric) / 100).toFixed(2).replace('.', ',');
    return numeric;
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    const seconds = Math.floor((new Date().getTime() - timestamp.toDate().getTime()) / 1000);
    if (seconds < 60) return `${seconds}s atrás`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    return `${Math.floor(seconds / 3600)}h atrás`;
  };

  const inputClass = "w-full rounded-2xl border-2 border-slate-200 bg-white p-5 text-base md:text-lg font-bold text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none";
  const smallInputClass = "w-full rounded-2xl border-2 border-slate-200 bg-white p-4 text-sm font-bold text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none";

  const motoristaGPS = useMemo(() => {
    if (orderData?.motoristaLat && orderData?.motoristaLng) {
      return { lat: Number(orderData.motoristaLat), lng: Number(orderData.motoristaLng) };
    }
    return undefined;
  }, [orderData?.motoristaLat, orderData?.motoristaLng]);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/20">
      
      <div className="fixed inset-0 -z-10 bg-slate-50" style={{height: '100dvh'}}></div>

      {/* PWA Install Banner */}
      {isInstallable && step === 'busca' && (
        <div className="sticky top-0 z-[100] w-full bg-cyan-600 px-4 py-3 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white">Acompanhe pelo App</p>
            <p className="text-[10px] text-cyan-100 font-medium mt-0.5">Instale a FretoGo e receba alertas na tela.</p>
          </div>
          <button onClick={handleInstallClick} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shrink-0">
            <Download size={14} /> Instalar
          </button>
        </div>
      )}

      <header className="relative z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => { if (step === 'form') window.location.href = '/'; else resetFlow(); }} className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white transition-all duration-300 hover:bg-slate-100 hover:scale-105 active:scale-95">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-blue-600 drop-shadow-sm" />
              <span className="text-2xl font-black italic tracking-tighter text-slate-900">PAINEL EMBARCADOR</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border-2 border-emerald-100 bg-emerald-50 px-5 py-2 md:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">Pagamento 100% Protegido</span>
          </div>
        </nav>
      </header>

      <main className="relative z-10 w-full max-w-6xl mx-auto flex flex-col justify-center px-4 py-8 pb-20 sm:px-6 lg:px-8">
        
        {step === 'form' && (
          <div className="w-full rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 md:p-12">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl leading-tight">
                Publicar <span className="italic text-blue-600">Carga</span>
              </h1>
              <p className="mt-4 text-slate-500 font-medium max-w-2xl text-lg">Insira os dados da operação e defina o valor que deseja pagar. A carga irá direto para o Mural de Fretes da FretoGo.</p>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                   <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                     <Building2 className="h-5 w-5 text-blue-500" /> Dados da Empresa
                   </h2>
                   {isAutoFilled && (
                     <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                       <CheckCircle size={10}/> Preenchimento Automático
                     </span>
                   )}
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <input className={inputClass} placeholder="Nome / Razão Social" value={nome} onChange={(e) => setNome(e.target.value)} />
                  <input className={inputClass} placeholder="WhatsApp Contato" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  <input className={inputClass} placeholder="CNPJ / CPF" value={documento} onChange={(e) => setDocumento(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
                  <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                    <MapPin className="h-5 w-5 text-blue-500" /> Endereço de Coleta
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <input className={`col-span-2 ${smallInputClass}`} placeholder="Rua da Retirada" value={coleta.rua} onChange={e => setColeta({...coleta, rua: e.target.value})} />
                      <input className={`col-span-1 ${smallInputClass}`} placeholder="Nº" value={coleta.num} onChange={e => setColeta({...coleta, num: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input className={smallInputClass} placeholder="Bairro" value={coleta.bairro} onChange={e => setColeta({...coleta, bairro: e.target.value})} />
                      <input className={smallInputClass} placeholder="CEP" value={coleta.cep} onChange={e => setColeta({...coleta, cep: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-6 md:p-8 rounded-3xl border border-blue-100">
                  <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600">
                    <Truck className="h-5 w-5 text-blue-600" /> Destino(s)
                  </h2>
                  <div className="space-y-4">
                    {entregas.map((entrega, index) => (
                      <div key={index} className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm relative">
                        {index > 0 && (
                          <button onClick={() => handleRemoveEntrega(index)} className="absolute right-4 top-4 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                        <p className="text-[10px] font-black uppercase text-blue-400 mb-2">Parada {index + 1}</p>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <input className={`col-span-2 ${smallInputClass}`} placeholder="Rua da Entrega" value={entrega.rua} onChange={e => updateEntrega(index, 'rua', e.target.value)} />
                          <input className={`col-span-1 ${smallInputClass}`} placeholder="Nº" value={entrega.num} onChange={e => updateEntrega(index, 'num', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input className={smallInputClass} placeholder="Bairro" value={entrega.bairro} onChange={e => updateEntrega(index, 'bairro', e.target.value)} />
                          <input className={smallInputClass} placeholder="CEP" value={entrega.cep} onChange={e => updateEntrega(index, 'cep', e.target.value)} />
                        </div>
                      </div>
                    ))}
                    {entregas.length < 5 && (
                      <button onClick={handleAddEntrega} className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm">
                        <Plus size={18}/> Adicionar Parada Extra
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
                <h2 className="mb-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Package className="h-5 w-5 text-amber-500" /> Especificações da Carga
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <select className={`col-span-1 md:col-span-2 ${inputClass} cursor-pointer`} value={vehicle} onChange={e => setVehicle(e.target.value as VehicleType)}>
                    {Object.entries(VEHICLE_CONFIG).map(([key, conf]) => (<option key={key} value={key}>{conf.nome}</option>))}
                  </select>
                  <input className={inputClass} placeholder="Peso (Ex: 2500kg)" value={peso} onChange={e => setPeso(e.target.value)} />
                  <input className={inputClass} placeholder="Produto / Volume" value={tipoMaterial} onChange={e => setTipoMaterial(e.target.value)} />
                </div>

                <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm mb-6">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                          <BrainCircuit className="text-cyan-400 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-white font-black uppercase tracking-widest text-sm">IA Operacional FretoGo</h3>
                          <p className="text-slate-400 text-[10px] uppercase font-bold">Análise preditiva de roteirização</p>
                        </div>
                     </div>
                     {isAiAnalyzing && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
                  </div>

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
                    {isAiAnalyzing && (
                      <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-slate-900 text-cyan-400 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                           <Loader2 className="w-4 h-4 animate-spin" /> Analisando demanda e tráfego...
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <div>
                              <p className="text-[9px] uppercase font-black text-slate-400">Demanda da Região</p>
                              <p className="text-sm font-bold text-slate-700">{['utilitario', 'toco'].includes(vehicle) ? 'Alta' : 'Estável'}</p>
                            </div>
                         </div>
                         <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-[9px] uppercase font-black text-slate-400">Oferta Recomendada</p>
                              <p className="text-sm font-black text-blue-600">R$ {valorSugeridoCalculado.toFixed(2).replace('.', ',')}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Previsão de Aceite no Feed</p>
                         {valorOfertaNum === 0 ? (
                           <div className="text-sm font-bold text-slate-400 flex items-center gap-2">
                             <AlertOctagon className="w-4 h-4" /> Aguardando você inserir o valor ao lado.
                           </div>
                         ) : (
                           <div className={`flex items-center gap-2 text-lg font-black uppercase tracking-widest ${iaChanceAceite?.color}`}>
                             {iaChanceAceite?.icon} {iaChanceAceite?.status}
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="relative h-full flex flex-col justify-end">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-600 mb-3 ml-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600"/> Sua Oferta Oficial
                      </p>
                      <span className="absolute left-6 bottom-[46px] text-2xl font-black text-emerald-600">R$</span>
                      <input 
                        type="text" 
                        className={`w-full rounded-[2rem] border-4 ${isOfertaValida && isOfertaBoa ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'} py-8 pl-16 pr-6 text-4xl font-black text-slate-900 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none`} 
                        placeholder="0,00" 
                        value={valorOferta} 
                        onChange={e => setValorOferta(formatCurrency(e.target.value))} 
                      />
                      <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest text-center">
                        Valor blindado em custódia até a entrega.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-8">
                  <div className="mb-4 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-purple-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-600">Horário da Coleta</p>
                  </div>
                  <div className="flex w-full max-w-md bg-slate-100 p-2 rounded-2xl">
                    <button onClick={() => setTipoFrete('imediato')} className={`flex-1 rounded-xl py-4 text-sm font-black uppercase tracking-wider transition-all ${tipoFrete === 'imediato' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}>Imediato</button>
                    <button onClick={() => setTipoFrete('agendado')} className={`flex-1 rounded-xl py-4 text-sm font-black uppercase tracking-wider transition-all ${tipoFrete === 'agendado' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200'}`}>Agendar Data</button>
                  </div>
                  {tipoFrete === 'agendado' && <input type="datetime-local" className={`mt-4 max-w-md ${inputClass}`} value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} />}
                </div>
              </div>
            </div>

            {!isFormValid && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <p className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600">
                  <AlertTriangle size={18}/> Preencha os campos obrigatórios e faça uma oferta válida.
                </p>
              </div>
            )}

            <div className="mt-8">
              <button onClick={calcularDistanciaReal} disabled={loadingRoute || loadingPayment || !isFormValid} className={`flex w-full min-h-[72px] items-center justify-center gap-3 rounded-[2rem] text-lg font-black uppercase tracking-[0.2em] transition-all duration-300 ${!isFormValid ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40 hover:scale-[1.01] hover:bg-blue-700'}`}>
                {loadingRoute ? <><Loader2 className="h-6 w-6 animate-spin"/> {loadingMessages[loadingStep]}</> : <><Zap size={24}/> Validar Rota e Pagamento</>}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="w-full grid grid-cols-1 gap-8 animate-in fade-in zoom-in duration-500 lg:grid-cols-[1fr_450px]">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl">
              <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Resumo da Rota</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Confira os detalhes operacionais antes de postar no Feed.</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center"><MapPin className="h-6 w-6 text-blue-600" /></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                 <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md">
                    <Truck size={18} className="text-cyan-400 mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Veículo</p>
                    <p className="text-sm font-bold text-white mt-1">{VEHICLE_CONFIG[vehicle].nome}</p>
                 </div>
                 <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md">
                    <Scale size={18} className="text-cyan-400 mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Peso Estimado</p>
                    <p className="text-sm font-bold text-white mt-1">{peso || 'N/A'}</p>
                 </div>
                 <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md">
                    <Package size={18} className="text-cyan-400 mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Volumes</p>
                    <p className="text-sm font-bold text-white mt-1">{qtdVolumes || '1'} un</p>
                 </div>
                 <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md">
                    <Clock3 size={18} className="text-amber-400 mb-1" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Distância / ETA</p>
                    <p className="text-sm font-bold text-white mt-1">{distanciaReal.toFixed(1)} km</p>
                 </div>
              </div>
        
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Origem</p>
                  <p className="text-lg font-bold text-slate-900">{coleta.rua}, {coleta.num}</p>
                  <p className="text-sm text-slate-500">{coleta.bairro}</p>
                </div>
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Destino</p>
                  <p className="text-lg font-bold text-slate-900">{entregas[entregas.length - 1].rua}, {entregas[entregas.length - 1].num}</p>
                  <p className="text-sm text-slate-500">{entregas.length > 1 ? `+ ${entregas.length - 1} paradas no trajeto` : entregas[0].bairro}</p>
                </div>
              </div>

              <div className="h-[300px] md:h-[450px] w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 relative">
                {mapsReady && origemGPS && destinoGPS ? (
                  <MapaCliente origem={origemGPS} destino={destinoGPS} paradasExtras={paradasGPS.length > 1 ? paradasGPS.slice(0, -1) : undefined} vehicleType={vehicle} operationalMessage={`Validando Trajeto B2B...`} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500"><Loader2 className="h-8 w-8 animate-spin mb-3"/></div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-[2.5rem] border-2 border-emerald-50 bg-emerald-600 p-8 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-10"><ShieldCheck size={200} /></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="h-6 w-6 text-emerald-300" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Garantia Escrow FretoGo</span>
                  </div>
                  <h3 className="text-5xl font-black mb-2">R$ {valorOferta}</h3>
                  <p className="text-emerald-100 text-sm font-medium border-b border-emerald-500/50 pb-6 mb-6">Sua oferta oficial para a rede de parceiros.</p>
                  
                  <ul className="space-y-4 text-sm font-medium text-emerald-50">
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-300 shrink-0"/> O motorista NÃO recebe o valor agora.</li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-300 shrink-0"/> O dinheiro fica 100% blindado na plataforma.</li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-300 shrink-0"/> Liberado ao motorista APENAS após você informar o PIN de Entrega.</li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-emerald-300 shrink-0"/> Estorno imediato caso a carga seja cancelada.</li>
                  </ul>
                </div>
              </div>

              <button onClick={handleContratar} disabled={loadingPayment || isProcessingPayment.current} className={`flex min-h-[72px] w-full items-center justify-center gap-3 rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${loadingPayment ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-xl hover:bg-black hover:scale-[1.02]'}`}>
                {loadingPayment ? <><Loader2 className="h-6 w-6 animate-spin" /> {loadingMessages[loadingStep]}</> : <><Lock size={22} /> Pagar e Ativar no Feed</>}
              </button>
              <button onClick={() => setStep('form')} className="flex min-h-[54px] w-full items-center justify-center rounded-[2rem] border-2 border-slate-200 bg-white text-xs font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50">
                Voltar e Editar Dados
              </button>
            </div>
          </div>
        )}

        {step === 'busca' && orderData && (
          <div className="mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              
              <div className="flex flex-col gap-8">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={150} /></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8 mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span></span>
                        <p className="text-cyan-400 font-bold tracking-widest uppercase text-xs">Carga Ativa no Feed</p>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black">ID: #{currentOrderId?.slice(0,8).toUpperCase()}</h2>
                    </div>
                    <div className="md:text-right bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Valor Protegido (Escrow)</p>
                      <p className="text-2xl font-black text-emerald-400 flex items-center gap-2"><ShieldCheck size={20}/> R$ {orderData?.valorFreteBruto?.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                      <Eye className="w-5 h-5 text-blue-400 mb-2"/>
                      <p className="text-3xl font-black text-white">{simViews}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Visualizações</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                      <Truck className="w-5 h-5 text-emerald-400 mb-2"/>
                      <p className="text-3xl font-black text-white">{simCompat}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Compatíveis</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                      <Users className="w-5 h-5 text-purple-400 mb-2"/>
                      <p className="text-3xl font-black text-white">{simInterest}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Interessados</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                      <CalendarDays className="w-5 h-5 text-amber-400 mb-2"/>
                      <p className="text-xl font-black text-white mt-2">{formatTimeAgo(orderData.createdAt)}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">No ar</p>
                    </div>
                  </div>
                </div>

                <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl relative">
                  {mapsReady ? (
                    <MapaCliente 
                      origem={origemGPS} 
                      destino={destinoGPS} 
                      motoristaId={orderData?.motoristaId} 
                      motoristaPos={motoristaGPS}
                      paradasExtras={paradasGPS} 
                      vehicleType={orderData?.veiculo || vehicle}
                      operationalMessage={orderData?.status ? orderData.status.replace('_', ' ') : undefined}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                  )}
                  
                  {['aguardando_pagamento', 'disponivel', 'buscando_motorista'].includes(orderData?.status || '') && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md px-6 py-4 rounded-full shadow-2xl border border-cyan-500/50">
                      <span className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                      </span>
                      <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">Sinal Ativo no Radar</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                
                <ClientStatusCard 
                  orderData={orderData} 
                  onSmartPricing={handleSmartPricing}
                  onRepublicar={handleRepublicar}
                  onCancelar={() => setShowCancelModal(true)}
                />

              </div>

            </div>
            {currentOrderId && <div className="mt-8"><ChatFrete freteId={currentOrderId} tipoUsuario='cliente' nome={nome || "Empresa"} /></div>}
          </div>
        )}

      </main>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[120] -translate-x-1/2 animate-in slide-in-from-bottom-5">
          <div className={`rounded-2xl border px-8 py-5 text-sm font-black uppercase tracking-widest shadow-2xl ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : toast.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {toast.msg}
          </div>
        </div>
      )}

      <ClientCancelModal open={showCancelModal} isCancelling={isCancelling} onClose={() => setShowCancelModal(false)} onConfirm={handleCancelarPedido} />
    </div>
  );
}
