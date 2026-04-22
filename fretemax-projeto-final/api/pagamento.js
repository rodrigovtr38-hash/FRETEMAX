import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    // Aqui está o ajuste: usando os nomes exatos que seu site envia
    const { titulo, preco, idPedido } = req.body;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [{
          id: idPedido || 'frete-manual',
          title: titulo || 'Frete FRETOGO',
          quantity: 1,
          unit_price: Number(preco),
          currency_id: 'BRL'
        }],
        payment_methods: {
          included_payment_types: [
            { id: 'ticket' }, // Boleto
            { id: 'bank_transfer' }, // PIX
            { id: 'credit_card' },
            { id: 'debit_card' }
          ],
          installments: 1
        },
        back_urls: {
          success: `https://${req.headers.host}/`,
          failure: `https://${req.headers.host}/`,
          pending: `https://${req.headers.host}/`
        },
        auto_return: 'approved',
      }
    });

    // Importante: o site espera 'url', então vamos entregar 'url'
    res.status(200).json({ url: result.init_point });
  } catch (error) {
    console.error('Erro MP:', error);
    res.status(500).json({ error: error.message });
  }
}
