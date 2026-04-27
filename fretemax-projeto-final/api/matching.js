import { db } from '../src/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Função matemática para calcular distância entre dois pontos (Haversine)
function calcularKM(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { freteId, lat, lng, veiculo } = req.body;

  try {
    // 1. Busca todos os motoristas que estão "disponiveis"
    const motoristasRef = collection(db, 'motoristas_online');
    const q = query(motoristasRef, where('status', '==', 'disponivel'));
    const snapshot = await getDocs(q);

    let motoristasProximos = [];

    // 2. Filtra por Raio de 15km e Categoria de Veículo
    snapshot.forEach(docSnap => {
      const motorista = docSnap.data();
      const distancia = calcularKM(lat, lng, motorista.lat, motorista.lng);

      if (distancia <= 15 && motorista.categoria === veiculo) {
        motoristasProximos.push({ id: docSnap.id, ...motorista, distancia });
      }
    });

    // 3. Ordena pelo mais próximo (Km)
    motoristasProximos.sort((a, b) => a.distancia - b.distancia);

    const escolhido = motoristasProximos[0];

    if (!escolhido) {
      console.log("Nenhum motorista encontrado no raio de 15km.");
      return res.status(200).json({ ok: false, message: "Buscando..." });
    }

    // 4. Faz o "Match" Automático: Atualiza o Frete e ocupa o Motorista
    const freteRef = doc(db, 'fretes', freteId);
    await updateDoc(freteRef, {
      status: 'aceito',
      motoristaId: escolhido.id,
      motoristaNome: escolhido.nome,
      motoristaZap: escolhido.whatsapp,
      logs: [{ tipo: 'match_automatico', data: new Date().toISOString() }]
    });

    // Ocupa o motorista para ele não receber outro frete
    const motRef = doc(db, 'motoristas_online', escolhido.id);
    await updateDoc(motRef, { status: 'ocupado' });

    console.log(`Match realizado: Frete ${freteId} entregue ao motorista ${escolhido.nome}`);
    return res.status(200).json({ ok: true, motorista: escolhido.nome });

  } catch (error) {
    console.error("Erro no Matching:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
