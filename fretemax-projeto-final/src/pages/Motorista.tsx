import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../lib/firestore-errors';
import { MessageCircle, CheckCircle2 } from 'lucide-react';

type VehicleType = 'carro pequeno' | 'utilitário' | 'caminhão 3/4' | 'carreta';

export default function Motorista() {
  const isAdmin = localStorage.getItem('adminMode') === 'true';

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('carro pequeno');

  // Return Freight
  const [retornoMode, setRetornoMode] = useState(false);
  const [retornoOrigem, setRetornoOrigem] = useState('');
  const [retornoDestino, setRetornoDestino] = useState('');

  // Orders
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [acceptedOrder, setAcceptedOrder] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u.uid);
      } else {
        setDriverProfile(null);
        setLoadingProfile(false);
      }
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'motoristas', uid));
      if (docSnap.exists()) {
        setDriverProfile(docSnap.data());
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `motoristas/${uid}`);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        alert('Erro ao fazer login com Google.');
      }
    }
  };

  const handleRegister = async () => {
    if (!name || !whatsapp || !city) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      const newProfile = {
        name,
        whatsapp,
        city,
        vehicleType,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'motoristas', user!.uid), newProfile);
      
      if (!isAdmin) {
        try {
          await addDoc(collection(db, 'leads_motoristas'), {
            ...newProfile,
            uid: user!.uid,
            createdAt: serverTimestamp()
          });
        } catch(e) { console.error(e) }
      }

      setDriverProfile(newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `motoristas/${user!.uid}`);
    }
  };

  useEffect(() => {
    if (!isAuthReady || !driverProfile || !user) return;

    // Fetch all available orders instead of filtering by city in query to allow return-freight logic
    const q1 = query(
      collection(db, 'fretes'),
      where('status', '==', 'aguardando_motorista')
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      setRawOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'fretes'));

    // Listen to accepted order
    const q2 = query(
      collection(db, 'fretes'),
      where('motoristaId', '==', user.uid),
      where('status', '==', 'aceito')
    );
    const unsub2 = onSnapshot(q2, (snap) => {
      if (!snap.empty) {
        setAcceptedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setAcceptedOrder(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'fretes'));

    return () => {
      unsub1();
      unsub2();
    };
  }, [isAuthReady, driverProfile, user]);

  useEffect(() => {
    let orders = rawOrders;
    if (retornoMode) {
      if (retornoOrigem && retornoDestino) {
        orders = orders.filter(o => 
          o.cidadeOrigem?.toLowerCase().includes(retornoOrigem.toLowerCase()) &&
          o.cidadeDestino?.toLowerCase().includes(retornoDestino.toLowerCase())
        ).map(o => ({ ...o, isRetorno: true }));
        setAvailableOrders(orders);
      } else {
        setAvailableOrders([]);
      }
    } else {
      orders = orders.filter(o => 
        o.cidadeOrigem?.toLowerCase().includes(driverProfile?.city?.toLowerCase() || '')
      );
      setAvailableOrders(orders);
    }
  }, [rawOrders, retornoMode, retornoOrigem, retornoDestino, driverProfile]);

  const handleAceitar = async (order: any) => {
    try {
      await updateDoc(doc(db, 'fretes', order.id), {
        status: 'aceito',
        motoristaId: user!.uid,
        motoristaNome: driverProfile.name,
        motoristaWhatsapp: driverProfile.whatsapp
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `fretes/${order.id}`);
    }
  };

  if (!isAuthReady || loadingProfile) return <div className="text-center p-8 text-slate-500">Carregando...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-8 text-center pt-10">
        <h2 className="text-[16px] font-semibold text-slate-800 mb-4">Área do Motorista</h2>
        <p className="text-slate-500 mb-8 text-[14px]">Faça login para encontrar fretes na sua região.</p>
        <button 
          onClick={handleLogin}
          className="w-full text-[15px] font-semibold cursor-pointer text-center bg-blue-600 hover:bg-blue-700 text-white p-[14px] rounded-lg transition-colors"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-neutral-50">
          <h2 className="text-[16px] font-semibold text-slate-800">Crie seu Perfil de Motorista</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="mb-4">
            <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Nome</label>
            <input className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">WhatsApp</label>
            <input className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400" placeholder="Ex: 11999999999" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Cidade de atuação</label>
            <input className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-[14px] transition-colors focus:border-blue-600 focus:outline-none placeholder:text-slate-400" placeholder="Ex: São Paulo, SP" value={city} onChange={e=>setCity(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 tracking-[0.5px]">Tipo de veículo</label>
            <select className="w-full p-3 border-[1.5px] border-slate-200 rounded-lg text-[14px] transition-colors focus:border-blue-600 focus:outline-none" value={vehicleType} onChange={e=>setVehicleType(e.target.value as VehicleType)}>
              <option value="carro pequeno">Carro Pequeno</option>
              <option value="utilitário">Utilitário</option>
              <option value="caminhão 3/4">Caminhão 3/4</option>
              <option value="carreta">Carreta (até 30 toneladas)</option>
            </select>
          </div>
          <button 
            onClick={handleRegister} 
            className="w-full p-[14px] border-none rounded-lg text-[15px] font-semibold cursor-pointer text-center bg-blue-600 hover:bg-blue-700 transition-colors text-white mt-4"
          >
            Salvar e Começar a Receber Fretes
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-8 items-center text-center gap-6">
        <div className="w-16 h-16 bg-[#dcfce7] text-[#166534] rounded-full flex items-center justify-center text-4xl">
          🎉
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-slate-800">Cadastro Aprovado!</h2>
          <p className="text-slate-500 mt-2 text-[15px] font-medium">
            Você é um Motorista Fundador. O app será liberado em 30 dias.
          </p>
        </div>
        <a 
          href="https://chat.whatsapp.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full mt-2 p-[14px] flex items-center justify-center gap-2 bg-[#25d366] text-white text-[16px] font-bold rounded-lg hover:bg-[#20ba56] transition-colors"
        >
          Entrar no Grupo VIP do WhatsApp
        </a>
      </div>
    );
  }

  if (acceptedOrder) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col p-8 items-center text-center gap-6">
        <div className="w-16 h-16 bg-[#dcfce7] text-[#166534] rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-800">Entrega em andamento</h2>
          <p className="text-slate-500 mt-2 text-sm">Você aceitou este frete.</p>
        </div>
        
        <div className="text-left w-full border border-slate-200 rounded-lg p-4 mt-2 mb-2 text-[14px] space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <strong className="text-slate-800">De:</strong> 
            <span className="text-slate-600">{acceptedOrder.cidadeOrigem}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 mt-2">
            <strong className="text-slate-800">Para:</strong> 
            <span className="text-slate-600">{acceptedOrder.cidadeDestino}</span>
          </div>
        </div>

        <a
          href={`https://wa.me/?text=Olá,%20sou%20o%20motorista%20do%20FreteMax.%20Estou%20a%20caminho!`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-[14px] border-none rounded-lg text-[15px] font-semibold cursor-pointer bg-[#25d366] hover:bg-[#20ba56] transition-colors text-white flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp (Cliente)
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-neutral-50 flex justify-between items-center">
          <h2 className="text-[16px] font-semibold text-slate-800">Painel do Motorista</h2>
          <span className="inline-block px-3 py-1 rounded-full text-[12px] font-semibold uppercase bg-[#eff6ff] text-blue-600">
            {driverProfile.city}
          </span>
        </div>

        {/* Return Freight Module */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white">
          <button 
            onClick={() => setRetornoMode(!retornoMode)}
            className={`text-[14px] font-semibold flex items-center gap-2 transition-colors ${retornoMode ? 'text-[#f97316]' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🔄 Buscar frete de retorno {retornoMode ? '(Ativo)' : ''}
          </button>
          
          {retornoMode && (
            <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 opacity-80">Cidade Atual</label>
                <input 
                  className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-orange-500 focus:outline-none"
                  value={retornoOrigem}
                  onChange={e => setRetornoOrigem(e.target.value)}
                  placeholder="Ex: Campinas"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase text-slate-500 mb-1.5 opacity-80">Destino Desejado</label>
                <input 
                  className="w-full p-2.5 border-[1.5px] border-slate-200 rounded-lg text-[13px] focus:border-orange-500 focus:outline-none"
                  value={retornoDestino}
                  onChange={e => setRetornoDestino(e.target.value)}
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {availableOrders.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-75 duration-1000"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-blue-50 rounded-full text-blue-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
              </div>
              <p className="text-[14px] leading-[1.6] font-medium text-slate-600">
                📡 Você está online. Buscando fretes na sua região...
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableOrders.map(order => (
                <div key={order.id} className="border border-slate-200 rounded-lg p-5 bg-white relative">
                  {order.isRetorno && (
                    <span className="absolute top-4 right-4 bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full text-[12px] font-bold">
                      🔥 Frete de retorno
                    </span>
                  )}
                  <div className="flex justify-between items-center mb-2 text-[14px]">
                    <strong className="text-slate-800">Origem:</strong> 
                    <span className="text-slate-600">{order.cidadeOrigem}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-[14px]">
                    <strong className="text-slate-800">Destino:</strong> 
                    <span className="text-slate-600">{order.cidadeDestino}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 text-[14px]">
                    <strong className="text-slate-800">Veículo:</strong> 
                    <span className="text-slate-600 uppercase text-xs  bg-slate-100 px-2 py-1 rounded">{order.veiculo}</span>
                  </div>
                  
                  {(order.responsavel || order.material || order.peso) && (
                    <div className="mt-3 mb-1 pt-3 border-t border-slate-100 text-[13px] text-slate-500 grid gap-1.5">
                      {order.responsavel && <div><strong className="text-slate-700">Resp:</strong> {order.responsavel}</div>}
                      {order.material && <div><strong className="text-slate-700">Material:</strong> {order.material}</div>}
                      {order.peso && <div><strong className="text-slate-700">Peso:</strong> {order.peso}</div>}
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4 text-[14px] mt-4 border-t border-slate-100 pt-3">
                    <strong className="text-slate-800 tracking-tight">Valor da Entrega:</strong> 
                    <span className="font-bold text-[#22c55e] text-xl tracking-tight">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valorMotorista)}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleAceitar(order)}
                    className="w-full mt-2 border-none rounded-lg text-[15px] p-[14px] bg-[#22c55e] hover:bg-green-600 text-white font-semibold cursor-pointer transition-colors"
                  >
                    Aceitar Frete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
