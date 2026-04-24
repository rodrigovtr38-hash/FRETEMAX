export default async function handler(req, res) {
  try {
    const payment = req.body;

    if (payment.type === 'payment') {
      const paymentId = payment.data.id;

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
      });
      const data = await response.json();

      if (data.status === 'approved') {
        const pedidoId = data.external_reference;

        // Atualiza o status no Firebase para a carga aparecer no Radar do Motorista
        await fetch(`https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/fretes/${pedidoId}?updateMask.fieldPaths=status&updateMask.fieldPaths=pagamentoStatus`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              status: { stringValue: 'aguardando_motorista' },
              pagamentoStatus: { stringValue: 'aprovado' }
            }
          })
        });
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Erro webhook');
  }
}
