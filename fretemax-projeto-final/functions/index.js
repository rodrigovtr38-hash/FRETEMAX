// =========================================================
// NOME DO ARQUIVO: functions/index.js
// CTO-Log: Auditoria Backend - Motor de Despacho (Ponte)
// Melhorias Implementadas:
// 1. Arquitetura "Mural/Feed": Cargas permanecem visíveis por 15 minutos reais.
// 2. Haversine Formula: Cálculo de distância nativo preciso.
// 3. Centralização das Coleções Oficiais.
// 4. 🔥 CTO FIX: Injeção da Cloud Function "getDistance" (Google Distance Matrix API).
// 5. 🔥 CTO FIX: Injeção direta da Chave de API para deploy automático via GitHub.
// 6. 🔥 CTO FIX: Auditoria Forense. Preservação do status real e error_message do Google na rejeição (REQUEST_DENIED, etc).
// =========================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();

const db = admin.firestore();

// 🛡 TRAVAS DE NUVEM
const runtimeOpts = {
  timeoutSeconds: 30, 
  memory: '256MB',    
  maxInstances: 50    
};

function calcularDistanciaExata(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

async function sendPushInternal(userId, tipo, titulo, corpo, dados) {
  try {
    const colecao = tipo === 'motorista' ? 'motoristas_cadastros' : 'clientes';
    const userDoc = await db.collection(colecao).doc(userId).get();
    
    if (!userDoc.exists) return false;

    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;

    if (!fcmToken) return false;

    const message = {
      token: fcmToken,
      notification: {
        title: titulo || 'FretoGo Network',
        body: corpo || 'Você tem uma nova notificação operacional'
      },
      data: dados || {},
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'fretes' }
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } }
      }
    };

    const response = await admin.messaging().send(message);
    console.log(`[PUSH] Disparado -> ${userId}`);
    return true;
  } catch (error) {
    console.error('[PUSH ERRO]', error.message);
    return false;
  }
}

// ========================================================
// 1. GEOCODE SEGURO 
// ========================================================
exports.getCoords = functions.runWith(runtimeOpts).https.onCall(async (data, context) => {
  const { address } = data;
  if (!address || typeof address !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Endereço inválido.');
  }
  
  // 🔥 CTO FIX: Chave injetada diretamente para deploy via GitHub
  const key = functions.config().google?.maps_key || process.env.GOOGLE_MAPS_KEY || "AIzaSyBTaI1NWrb_NGmOEjT_qiwOo_JYZC3f1aY";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;

  try {
    const res = await axios.get(url, { timeout: 5000 });
    
    if (res.data.status !== 'OK' || !res.data.results?.[0]) {
      // 🔥 Extração Forense: Salva a resposta original do Google para o Frontend
      const googleStatus = res.data.status || 'STATUS_DESCONHECIDO';
      const googleErrorMsg = res.data.error_message || 'Nenhuma mensagem detalhada do Google';
      throw new functions.https.HttpsError('failed-precondition', `Google API Recusou: [${googleStatus}] | Detalhe: ${googleErrorMsg}`);
    }
    
    const { lat, lng } = res.data.results[0].geometry.location;
    return { lat, lng };
  } catch (error) {
    // Se o erro já for um HttpsError (lançado pelo if acima), repassa ele intacto
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    // Se for falha de rede do Axios (HTTP 403, 400, etc), extrai os dados reais
    const netStatus = error.response?.status || 'SEM_STATUS_HTTP';
    const netData = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    throw new functions.https.HttpsError('internal', `Falha de Conexão Axios [${netStatus}]: ${netData}`);
  }
});

// ========================================================
// 1.1. DISTANCE MATRIX (🔥 CTO FIX: A FUNÇÃO QUE FALTAVA)
// ========================================================
exports.getDistance = functions.runWith(runtimeOpts).https.onCall(async (data, context) => {
  const { origin, destination } = data;
  
  if (!origin || !destination) {
    throw new functions.https.HttpsError('invalid-argument', 'Origem e destino são obrigatórios.');
  }

  // 🔥 CTO FIX: Chave injetada diretamente para deploy via GitHub
  const key = functions.config().google?.maps_key || process.env.GOOGLE_MAPS_KEY || "AIzaSyBTaI1NWrb_NGmOEjT_qiwOo_JYZC3f1aY";
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${key}`;

  try {
    const res = await axios.get(url, { timeout: 5000 });
    
    if (res.data.status !== 'OK' || !res.data.rows[0]?.elements[0]) {
      const googleStatus = res.data.status || 'STATUS_DESCONHECIDO';
      const googleErrorMsg = res.data.error_message || 'Nenhuma mensagem detalhada do Google';
      throw new functions.https.HttpsError('failed-precondition', `Google Distance API Recusou: [${googleStatus}] | Detalhe: ${googleErrorMsg}`);
    }

    const element = res.data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
       throw new functions.https.HttpsError('failed-precondition', `Rota impossível. Element Status: [${element.status}]`);
    }

    // Google retorna em metros. Dividimos por 1000 para a plataforma usar KM exatos (Ex: 500m = 0.5km).
    const distanceInMeters = element.distance.value;
    return distanceInMeters / 1000;

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    const netStatus = error.response?.status || 'SEM_STATUS_HTTP';
    const netData = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    throw new functions.https.HttpsError('internal', `Falha de Conexão Axios Matrix [${netStatus}]: ${netData}`);
  }
});

// ========================================================
// 2. O DESPERTADOR (CRON JOB DE FRETE AGENDADO)
// ========================================================
exports.despertadorAgendamentos = functions.runWith(runtimeOpts).pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const agora = new Date();
  const limiteD1 = new Date(agora.getTime() + 24 * 60 * 60 * 1000); 
  const limite1h = new Date(agora.getTime() + 1 * 60 * 60 * 1000); 

  const fretesD1 = await db.collection('fretes')
    .where('agendadoPara', '<=', limiteD1)
    .where('notificadoD1', '==', false)
    .where('status', 'in', ['disponivel', 'buscando_motorista'])
    .limit(200) 
    .get();

  const batch = db.batch();

  fretesD1.forEach(doc => {
    batch.update(doc.ref, { 
      notificadoD1: true, 
      pendenteEnvioWhatsApp: true,
      tipoNotificacaoWorker: 'D-1',
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  const fretes1h = await db.collection('fretes')
    .where('agendadoPara', '<=', limite1h)
    .where('notificado1h', '==', false)
    .where('status', 'in', ['disponivel', 'buscando_motorista'])
    .limit(200)
    .get();

  fretes1h.forEach(doc => {
    batch.update(doc.ref, { 
      notificado1h: true, 
      pendenteEnvioWhatsApp: true,
      tipoNotificacaoWorker: 'D-HORA',
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  if (fretesD1.size > 0 || fretes1h.size > 0) {
    await batch.commit();
  }
  return null;
});

// ========================================================
// 3. O OPERÁRIO (WORKER ASSÍNCRONO DE WHATSAPP)
// ========================================================
exports.workerNotificacoes = functions.firestore.document('fretes/{freteId}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();

  // Tratativa WhatsApp
  if (newValue.pendenteEnvioWhatsApp === true && previousValue.pendenteEnvioWhatsApp !== true) {
    try {
      const telefone = newValue.telefoneCliente || newValue.clienteZap;
      if (!telefone) throw new Error("Sem telefone na carga.");

      const apiUrl = process.env.WHATSAPP_API_URL;
      if (apiUrl) {
         await axios.post(apiUrl, {
            phone: telefone,
            message: `📦 *FretoGo Network*\n\nAviso Operacional: Sua carga agendada está próxima! Status: ${newValue.tipoNotificacaoWorker}`
         }, {
            headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` },
            timeout: 5000
         });
      }

      await change.after.ref.update({
        pendenteEnvioWhatsApp: false,
        erroWhatsApp: null
      });

    } catch (error) {
      await change.after.ref.update({
        pendenteEnvioWhatsApp: false,
        erroWhatsApp: 'Falha API Externa'
      });
    }
  }

  // Notifica Cliente no celular via Push (Coleta Feita)
  if (newValue.status === 'coletando' && previousValue.status !== 'coletando') {
    if (newValue.clienteId) {
      await sendPushInternal(
        newValue.clienteId, 
        'cliente', 
        '✅ Carga Coletada', 
        `O motorista ${newValue.motoristaNome || 'parceiro'} confirmou o embarque. Acompanhe a rota pelo painel.`, 
        { freteId: context.params.freteId, tipo: 'coleta' }
      );
    }
  }

  return null;
});

// ========================================================
// 4. RESET DIÁRIO DE RETORNO (CRON MEIA-NOITE)
// ========================================================
exports.resetContadorRetorno = functions.runWith({ timeoutSeconds: 60, memory: '512MB' })
  .pubsub.schedule('0 0 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    
    const collectionsToReset = ['motoristas_cadastros', 'motoristas_online'];
    
    for (const col of collectionsToReset) {
      let emProcessamento = true;
      while (emProcessamento) {
        const snapshot = await db.collection(col)
          .where('retornosUsadosHoje', '>', 0)
          .limit(400)
          .get();
          
        if (snapshot.empty) {
          emProcessamento = false;
          break;
        }
        
        const batch = db.batch();
        snapshot.forEach(doc => {
          batch.update(doc.ref, {
            retornosUsadosHoje: 0,
            modoRetorno: false,
            destinoRetorno: admin.firestore.FieldValue.delete(),
            atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }
    }
    return null;
  });

// ========================================================
// 5. ATIVAÇÃO ATÔMICA DO MODO RETORNO
// ========================================================
exports.ativarModoRetorno = functions.runWith(runtimeOpts).https.onCall(async (data, context) => {
  const uid = context.auth?.uid || data.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Sessão inválida.');

  const { destinoRetorno, lat, lng } = data;
  if (!destinoRetorno) throw new functions.https.HttpsError('invalid-argument', 'Destino obrigatório.');

  const motoristaRef = db.collection('motoristas_cadastros').doc(uid);
  const motoristaOnlineRef = db.collection('motoristas_online').doc(uid);

  try {
    await db.runTransaction(async (transaction) => {
      const onlineSnap = await transaction.get(motoristaOnlineRef);
      if (!onlineSnap.exists) throw new Error('MOTORISTA_OFFLINE'); 

      const docSnap = await transaction.get(motoristaRef);
      const usados = docSnap.exists ? (docSnap.data().retornosUsadosHoje || 0) : 0;
      
      if (usados >= 2) throw new Error('LIMITE_RETORNO_DIARIO_ATINGIDO');

      const payloadUpdate = {
        modoRetorno: true,
        destinoRetorno: destinoRetorno.trim(),
        retornosUsadosHoje: usados + 1,
        latitudeRetorno: lat || null,
        longitudeRetorno: lng || null,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(motoristaRef, payloadUpdate, { merge: true });
      transaction.set(motoristaOnlineRef, payloadUpdate, { merge: true });
    });

    return { success: true, message: 'Modo Retorno Armado.' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ========================================================
// 6. RADAR DO MURAL (Broadcasting - Avisa a frota, mas NÃO trava a carga)
// ========================================================
exports.iniciarDespachoAutomatico = functions.runWith(runtimeOpts).firestore
  .document('fretes/{freteId}')
  .onUpdate(async (change, context) => {
    const antes = change.before.data();
    const depois = change.after.data();
    const freteId = context.params.freteId;

    // Só dispara se acabou de entrar no Mural
    if (antes.status === 'disponivel' || depois.status !== 'disponivel') return null;

    try {
      const origemLat = depois.origem?.lat || depois.origemLat;
      const origemLng = depois.origem?.lng || depois.origemLng;
      const categoria = depois.categoria;

      if (!origemLat || !origemLng) return null;

      // Busca motoristas no setor
      const motoristasSnap = await db.collection('motoristas_online')
        .where('online', '==', true)
        .where('disponivel', '==', true)
        .where('categoria', 'array-contains', categoria)
        .get();

      // CTO: Se não tiver ninguém, NÃO MATA A CARGA. Apenas deixa no Feed rodando os 15 min!
      if (!motoristasSnap.empty) {
        // Se houver motoristas, dispara push para quem estiver num raio de 50km
        motoristasSnap.forEach(async (doc) => {
          const m = doc.data();
          if (!m.latitude || !m.longitude) return;

          const dist = calcularDistanciaExata(origemLat, origemLng, m.latitude, m.longitude);
          if (dist <= 50) {
            const valorMotorista = depois.valorMotorista || depois.valorTotal || 0;
            await sendPushInternal(
              doc.id,
              'motorista',
              '🚚 Nova Carga no Mural!',
              `R$ ${valorMotorista.toFixed(2)} - A ${dist.toFixed(1)}km de você. Abra o app para aceitar!`,
              { freteId: freteId, tipo: 'novo_frete' }
            );
          }
        });
      }

      // CTO: Mantém o status 'disponivel', mas marca o relógio real de morte para 15 minutos no futuro.
      await change.after.ref.update({
        ofertaExpiraEm: admin.firestore.Timestamp.fromMillis(Date.now() + 15 * 60 * 1000), // 15 Minutos de vida no Feed
        dispatchStatus: 'mural_aberto',
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error(`[MURAL ERRO]`, error);
    }
    return null;
  });

// ========================================================
// 7. WATCHDOG DO MURAL (O verdadeiro Ceifador de 15 Minutos)
// ========================================================
exports.watchdogOfertasExpiradas = functions.runWith(runtimeOpts).pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const agora = admin.firestore.Timestamp.now();
  
  // Caça apenas cargas cujo relógio de 15 minutos já estourou
  const fretesExpirados = await db.collection('fretes')
    .where('status', '==', 'disponivel')
    .where('dispatchStatus', '==', 'mural_aberto')
    .where('ofertaExpiraEm', '<', agora)
    .limit(100)
    .get();

  if (fretesExpirados.empty) return null;

  const batch = db.batch();

  for (const docFrete of fretesExpirados.docs) {
    // Fim da linha. 15 minutos se passaram e ninguém da rede pegou.
    batch.update(docFrete.ref, {
         status: 'sem_motorista', 
         dispatchStatus: 'encerrado',
         motivoEncerramento: 'Tempo limite do Mural (15min) excedido',
         atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  return null;
});

// ========================================================
// 8. NOTIFICAÇÃO DE ENTREGA CONCLUÍDA
// ========================================================
exports.notificarEntregaConcluida = functions.firestore.document('fretes/{freteId}').onUpdate(async (change, context) => {
  const antes = change.before.data();
  const depois = change.after.data();
  
  if (antes.status !== 'em_transporte' && antes.status !== 'finalizando') return null;
  if (depois.status !== 'entregue' && depois.status !== 'finalizado') return null;
  
  if (depois.clienteId) {
    await sendPushInternal(
      depois.clienteId,
      'cliente',
      '📦 Entrega Blindada Realizada',
      `O valor retido em Escrow foi liberado ao motorista. PIN utilizado: ${depois.pinEntregas?.[0] || 'confirmado'}`,
      { freteId: context.params.freteId, tipo: 'entrega' }
    );
  }
  return null;
});
