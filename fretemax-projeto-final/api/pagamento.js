import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Inicializa o cliente do MP com o seu Token de Produção
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preference = new Preference(client);

    const { titulo, preco, idPedido } = req.body;

    const response = await preference.create({
      body: {
        items: [
          {
            id: idPedido,
            title: titulo || 'Frete FRETOGO',
            quantity: 1,
            unit_price: Number(preco),
            currency_id: 'BRL',
          }
        ],
        back_urls: {
          success: 'https://fretogo.com.br/cliente',
          failure: 'https://fretogo.com.br/cliente',
          pending: 'https://fretogo.com.br/cliente',
        },
        auto_return: 'approved',
      }
    });

    return res.status(200).json({ url: response.init_point });
    
  } catch (error) {
    console.error("Erro interno do Mercado Pago:", error);
    return res.status(500).json({ error: 'Erro ao gerar link de pagamento' });
  }
}
