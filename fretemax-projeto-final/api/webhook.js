// CTO-Log: Auditoria Etapa 5 (Escrow e Pagamentos) - REVISÃO FINAL.
// 1. CORREÇÃO CRÍTICA DO BURACO NEGRO DE PAGAMENTO MANTIDA.
// 2. 🛡️ BLINDAGEM DE ASSINATURA DUPLA (KEY ROTATION BUG FIX) com trava de segurança estrita.
// 3. 🔥 CTO FIX: Refatoração Serverless com prevenção de Memory Leak no Timeout.
// 4. 🔥 CTO FIX (FASE 5): Inversão do Funil. O Webhook agora destrava a "Reserva" e joga o Motorista para a Viagem (ACEITO).
// 5. 🔥 CTO FIX (FASE 8): Distinção semântica de falhas financeiras (Rejected/Cancelled) sem corromper Estado Operacional.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

// 1. INICIALIZAÇÃO BLINDADA DO FIREBASE
if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_CREDENTIAL) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL))
    });
  } else {
    console.error("[ERRO CRÍTICO SERVERLESS] FIREBASE_ADMIN_CREDENTIAL não configurado na Vercel.");
  }
}

const db = getFirestore();

// 2. MÓDULO DE NOTIFICAÇÃO (Com Prevenção de Memory Leak)
async function dispararWhatsAppSeguro(telefone, mensagem) {
  const apiUrl = process.env.WHATSAPP_API_URL; 
  if (!apiUrl) {
    console.warn("[WHATSAPP ALERTA] WHATSAPP_API_URL não configurada no ambiente. Notificação ignorada.");
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); 

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
      },
      body: JSON.stringify({ phone: telefone, message: mensagem }),
      signal: controller.signal
    });
  } catch (e) {
    console.error("[WHATSAPP ERRO] Falha na comunicação com o provedor de disparo:", e.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

// 3. NÚCLEO FINANCEIRO DO WEBHOOK
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];

    const dataId = req.query.id || req.query['data.id'] || req.body?.data?.id;
    const type = req.query.topic || req.body?.type || req.body?.action;

    if (!process.env.MP_WEBHOOK_SECRET) {
      console.error("[ERRO DE INFRAESTRUTURA] MP_WEBHOOK_SECRET não encontrado nas variáveis da Vercel.");
      return res.status(500).send('Configuração de servidor ausente');
    }

    if (xSignature) {
      const parts = xSignature.split(',');
      const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
      
      const v1Signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.split('=')[1]);
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      
      const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
        .update(manifest).digest('hex');
      
      if (!v1Signatures.includes(hmac)) {
        console.error(`[FRAUDE BLOQUEADA] Assinatura calculada não confere com o Mercado Pago. ID: ${dataId}`);
        return res.status(401).send('Assinatura inválida');
      }
    } else {
        console.warn("[ALERTA DE SEGURANÇA] Webhook recebido sem x-signature.");
    }

    const isPayment = type === 'payment' || type?.startsWith('payment');

    // 4. LÓGICA DE NEGÓCIOS E ATUALIZAÇÃO DE STATUS
    if (isPayment && dataId) {
      const paymentId = dataId;
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` }
      });

      if (!mpResponse.ok) return res.status(500).send('Erro de comunicação com a API do Mercado Pago');

      const paymentData = await mpResponse.json();
      const pedidoId = paymentData.external_reference;

      if (!pedidoId) {
          console.error(`[ALERTA FINANCEIRO] Pagamento ${paymentId} recebido sem referência (external_reference) ao Frete.`);
          return res.status(400).send('Sem referência no pagamento');
      }

      const freteRef = db.collection('fretes').doc(pedidoId);
      const freteSnap = await freteRef.get();

      if (freteSnap.exists) {
        const freteData = freteSnap.data();

        // CASO 1: PAGAMENTO APROVADO (Fluxo de Liberação Logística)
        if (paymentData.status === 'approved') {
          
          if (freteData.pagamentoStatus !== 'aprovado') {
            
            // 🔥 CTO FIX: Libera a operação! Transforma a Reserva em Viagem Ativa (ACEITO)
            await freteRef.update({
              status: 'aceito', 
              pagamentoStatus: 'aprovado',
              dispatchStatus: 'confirmado', 
              pagoEm: FieldValue.serverTimestamp(),
              pagamentoId: paymentId,
              atualizadoEm: FieldValue.serverTimestamp()
            });
            
            console.log(`[SUCESSO] Escrow Validado. Pagamento ${pedidoId} Aprovado. Viagem Liberada!`);

            if (freteData.clienteZap || freteData.telefoneCliente) {
               const zapCliente = freteData.clienteZap || freteData.telefoneCliente;
               const linkRastreio = `https://app.fretogo.com.br/cliente?order=${pedidoId}`;
               
               const mensagemZap = `✅ *FretoGo*: Pagamento Escrow confirmado!\n\nA operação foi liberada oficialmente. O motorista parceiro já recebeu os endereços exatos e está autorizado a iniciar a rota.\n\n📍 *Acompanhe a viagem em tempo real e pegue seus PINs de Segurança no link abaixo:*\n${linkRastreio}`;
               
               await dispararWhatsAppSeguro(zapCliente, mensagemZap);
            }
          }

        // CASO 2: PAGAMENTO REJEITADO, CANCELADO, ESTORNADO (Falhas Financeiras)
        } else if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentData.status)) {
          
          // 🔥 CTO FIX: Registramos a falha financeira sem mexer no status operacional da carga (status),
          // para não jogar a carga no Radar enquanto o Realtime DB do motorista ainda está em RESERVADO.
          if (freteData.pagamentoStatus !== paymentData.status) {
            await freteRef.update({
              pagamentoStatus: paymentData.status,
              atualizadoEm: FieldValue.serverTimestamp()
            });
            
            console.warn(`[WEBHOOK ALERTA] Pagamento ${paymentId} retornou como '${paymentData.status}'. Motorista ${freteData.motoristaId} requer desvinculação atômica (RTDB) pendente de auditoria operacional.`);
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (err) {
    console.error(`[WEBHOOK PANIC CRÍTICO]:`, err);
    res.status(500).send('Erro interno no servidor de pagamentos');
  }
}
