export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    const payment = req.body;

    if (payment.type === 'payment') {
      const paymentId = payment.data.id;

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` 
        }
      });

      const paymentData = await mpResponse.json();
      const pedidoId = paymentData.external_reference;

      if (!pedidoId) return res.status(400).send('External Reference ausente');

      let novoStatus;

      if (paymentData.status === 'approved') {
        novoStatus = 'aguardando_motorista';
      } else if (['rejected', 'cancelled', 'expired'].includes(paymentData.status)) {
        novoStatus = 'erro_pagamento';
      } else {
        return res.status(200).send('Ignorado');
      }

      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/fretes/${pedidoId}`;

      // 🔥 Busca os dados do frete antes de atualizar
      const getDoc = await fetch(firebaseUrl);
      const docSnap = await getDoc.json();

      const statusAtual = docSnap?.fields?.status?.stringValue;

      if (statusAtual === novoStatus) {
        return res.status(200).send('Já atualizado');
      }

      // 1. Atualiza o status no Firebase
      await fetch(`${firebaseUrl}?updateMask.fieldPaths=status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: novoStatus }
          }
        })
      });

      // 2. 🔥 SE FOI APROVADO, CHAMA O MATCHING AUTOMÁTICO
      if (novoStatus === 'aguardando_motorista') {
        const lat = docSnap.fields.origemLat?.doubleValue || docSnap.fields.origemLat?.integerValue;
        const lng = docSnap.fields.origemLng?.doubleValue || docSnap.fields.origemLng?.integerValue;
        const veiculo = docSnap.fields.veiculo?.stringValue;

        // Chama o robô que criamos no Passo 2
        await fetch(`https://${req.headers.host}/api/matching`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freteId: pedidoId,
            lat: lat,
            lng: lng,
            veiculo: veiculo
          })
        });
      }

      console.log(`Pedido ${pedidoId} processado e enviado para matching.`);
    }

    res.status(200).send('OK');

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro');
  }
}
