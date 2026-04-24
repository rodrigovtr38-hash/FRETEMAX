export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { titulo, preco, idPedido } = req.body;

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: titulo,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: Number(preco)
          }
        ],
        external_reference: idPedido,
        notification_url: `https://${req.headers.host}/api/webhook`
      })
    });

    const data = await response.json();
    return res.status(200).json({ url: data.init_point });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
}
