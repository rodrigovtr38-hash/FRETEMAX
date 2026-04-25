import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    const payment = req.body;
    
    // 1. VALIDAÇÃO DE ASSINATURA REAL (HMAC SHA256) - Impede fraude
    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    
    if (signatureHeader && secret) {
      const parts = signatureHeader.split(',');
      let ts = '', v1 = '';
      parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') v1 = value;
      });

      const manifest = `id:${payment.data?.id};request-id:${requestId};ts:${ts};`;
      const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      
      if (hash !== v1) {
        console.error("ALERTA DE SEGURANÇA: Assinatura Inválida.");
        return res.status(403).send('Acesso Negado');
      }
    }

    if (payment.type === 'payment') {
      const paymentId = payment.data.id;
      
      // 2. Double Check com a API do Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
      });
      const paymentData = await mpResponse.json();
      const pedidoId = paymentData.external_reference;

      if (!pedidoId) return res.status(400).send('External Reference ausente');

      // 3. Mapeamento da STATE MACHINE OFICIAL
      let novoStatus, tipoLog;
      if (paymentData.status === 'approved') {
        novoStatus = 'aguardando_motorista';
        tipoLog = 'pagamento_aprovado';
      } else if (['rejected', 'cancelled', 'expired'].includes(paymentData.status)) {
        novoStatus = 'erro_pagamento';
        tipoLog = 'pagamento_falhou';
      } else {
         return res.status(200).send('Status pendente/ignorado');
      }

      // 4. ATUALIZAÇÃO SEGURA VIA FIRESTORE REST API
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${process.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/fretes/${pedidoId}`;
      
      // Busca o documento atual para não sobrescrever dados e pegar os logs antigos
      const getDoc = await fetch(firebaseUrl);
      const docData = await getDoc.json();
      
      const statusAtual = docData.fields?.status?.stringValue;
      
      // Validação de Idempotência
      if (statusAtual === novoStatus || statusAtual === 'aceito') {
          return res.status(200).send('Já processado');
      }

      // APPEND SEGURO DOS LOGS
      let logsExistentes = docData.fields?.logs?.arrayValue?.values || [];
      logsExistentes.push({
          mapValue: {
              fields: {
                  tipo: { stringValue: tipoLog },
                  data: { stringValue: new Date().toISOString() }
              }
          }
      });

      // PATCH (Aplica a mudança)
      await fetch(`${firebaseUrl}?updateMask.fieldPaths=status&updateMask.fieldPaths=logs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: novoStatus },
            logs: { arrayValue: { values: logsExistentes } }
          }
        })
      });
      
      console.log(`Webhook Processado. Pedido: ${pedidoId} Status: ${novoStatus}`);
    }
    
    res.status(200).send('OK');
  } catch (err) {
    console.error('Erro Fatal no Webhook:', err);
    res.status(500).send('Erro interno');
  }
}
