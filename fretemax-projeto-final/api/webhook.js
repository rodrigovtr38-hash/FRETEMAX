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

      await fetch(`${firebaseUrl}?updateMask.fieldPaths=status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: novoStatus }
          }
        })
      });

      console.log(`Pedido ${pedidoId} atualizado para ${novoStatus}`);
    }

    res.status(200).send('OK');

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro');
  }
}
