// Arquivo: api/pagamento.js
import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // AQUI VAI O SEU ACCESS TOKEN (Seguro no servidor)
  const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-1578096456589989-042105-ad9a178da7dc02fdad17444dcd9395ff-3349553055' 
  });
  
  const preference = new Preference(client);

  try {
    const { titulo, preco, idPedido } = req.body;

    const response = await preference.create({
      body: {
        items: [
          {
            id: idPedido,
            title: titulo,
            quantity: 1,
            unit_price: Number(preco)
          }
        ],
        back_urls: {
          success: "https://fretogo.com.br", // Volta pra cá se pagar
          failure: "https://fretogo.com.br", // Volta pra cá se der erro
          pending: "https://fretogo.com.br"
        },
        auto_return: "approved",
        external_reference: idPedido // O ID do frete no Firebase
      }
    });

    // Devolve o link de pagamento do Checkout Pro
    res.status(200).json({ url: response.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
}
