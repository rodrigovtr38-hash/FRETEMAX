import { db } from '../src/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

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
    const motoristasRef = collection(db, 'motoristas_online');
    const q = query(motoristasRef, where('status', '==', 'disponivel'));
    const snapshot = await getDocs(q);

    let motoristasProximos = [];

    snapshot.forEach(docSnap => {
      const motorista = docSnap.data();
      const distancia = calcularKM(lat, lng, motorista.lat, motorista.lng);
      // Filtra por 15km e categoria exata
      if (distancia <= 15 && motorista.categoria.toLowerCase() === veiculo.toLowerCase()) {
        motoristasProximos.push({ id: docSnap.id, ...motorista, distancia });
      }
    });

    // Ordena do mais perto para o mais longe
    motoristasProximos.sort((a, b) => a.distancia - b.distancia);

    if (motoristasProximos.length === 0) {
      return res.status(200).json({ ok: false, message: "Nenhum motorista no raio" });
    }

    // Pega o primeiro da fila (o mais próximo)
    const escolhido = motoristasProximos[0];

    const freteRef = doc(db, 'fretes', freteId);
    await updateDoc(freteRef, {
      status: 'aceito',
      motoristaId: escolhido.id,
      motoristaNome: escolhido.nome,
      motoristaZap: escolhido.whatsapp,
      // Salva a fila completa nos logs para caso o 1º não aceite (Step futuro)
      filaMatching: motoristasProximos.map(m => m.id), 
      logs: [{ tipo: 'match_automatico_fila', data: new Date().toISOString(), motorista: escolhido.nome }]
    });

    const motRef = doc(db, 'motoristas_online', escolhido.id);
    await updateDoc(motRef, { status: 'ocupado' });

    return res.status(200).json({ ok: true, motorista: escolhido.nome });

  } catch (error) {
    console.error("Erro no Matching:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}

