import { MercadoPagoConfig, Payment } from 'mercadopago';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// O Admin SDK usa as variáveis de ambiente que você já configurou na Vercel
if (!getApps().length) {
    initializeApp();
}
const db = getFirestore();

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');

    try {
        const { type, data } = req.body;

        if (type === 'payment' && data?.id) {
            const payment = new Payment(client);
            const pStatus = await payment.get({ id: data.id });

            if (pStatus.status === 'approved') {
                // Pegamos o ID do frete que o sistema envia para o Mercado Pago
                const freteId = pStatus.external_reference || pStatus.additional_info?.items[0]?.id;
                
                if (freteId) {
                    // MÁGICA PARA FIRESTORE: Atualiza o documento na coleção 'fretes'
                    const freteRef = db.collection('fretes').doc(freteId);
                    await freteRef.update({
                        status: 'paid',
                        paidAt: new Date().toISOString()
                    });
                    console.log(`CTO: Frete ${freteId} marcado como PAGO no Firestore.`);
                }
            }
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no Webhook Firestore:', error);
        res.status(500).send('Erro interno');
    }
}
