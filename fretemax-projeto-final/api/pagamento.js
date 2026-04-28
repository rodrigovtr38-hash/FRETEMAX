export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  const { titulo, preco, idPedido } = req.body;

  try {
    const valor = Number(preco);

    if (!valor || valor <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

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
            unit_price: valor
          }
        ],
        external_reference: idPedido,
        notification_url: `https://${req.headers.host}/api/webhook`,

        // 🔥 FORÇANDO A LIBERAÇÃO DE MÉTODOS
        payment_methods: {
          excluded_payment_types: [], // Deixa vazio para não excluir nada
          excluded_payment_methods: [],
          installments: 12,
          default_installments: 1
        },

        // Informações para ajudar na aprovação do Pix/Cartão
        statement_descriptor: "FRETOGO", 

        back_urls: {
          success: `https://${req.headers.host}/cliente`, // Volta pro radar
          failure: `https://${req.headers.host}/cliente`,
          pending: `https://${req.headers.host}/cliente`
        },
        auto_return: "approved"
      })
    });

    const data = await response.json();

    if (!data.init_point) {
      console.error("Erro MP:", data);
      return res.status(500).json({ error: 'Erro ao criar preferência' });
    }

    return res.status(200).json({ url: data.init_point });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
}

