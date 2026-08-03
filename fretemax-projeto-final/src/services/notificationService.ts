// =========================================================
// NOME DO ARQUIVO: src/services/notificationService.ts
// CTO-Log: Auditoria Concluída - IA e WhatsApp Integrados
// Status: Válvulas de comunicação de máquina para humano operacionais.
// =========================================================

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, app } from '../firebase';

let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('[CTO-Log] Firebase Messaging não suportado neste navegador/dispositivo.');
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export class NotificationService {
  
  static tocarAlertaSonoro(tipo: 'nova_carga' | 'sucesso' | 'alerta' = 'nova_carga') {
    try {
      let audioUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; 
      if (tipo === 'sucesso') audioUrl = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';
      if (tipo === 'alerta') audioUrl = 'https://assets.mixkit.co/active_storage/sfx/940/940-preview.mp3';

      const beep = new Audio(audioUrl);
      beep.play().catch(() => console.warn('[CTO-Log] Bloqueio de autoplay do navegador ativo.'));
    } catch (error) {
      console.error('[CTO-Log] Falha ao acionar alerta sonoro:', error);
    }
  }

  // 🔥 Nova Função: Enviar Notificação In-App (Toast ou Navegador)
  static enviarNotificacaoApp(userId: string, titulo: string, mensagem: string) {
    // Se estivéssemos num backend, isso dispararia via Admin SDK.
    // Como estamos no frontend, criamos a notificação nativa do aparelho.
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: mensagem,
        icon: '/icon-192.png'
      });
    }
    console.log(`[PUSH SIMULADO -> ${userId}] ${titulo}: ${mensagem}`);
  }

  static async solicitarPermissao(userId: string, tipo: 'motorista' | 'cliente'): Promise<string | null> {
    if (!messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;

      if (!VAPID_KEY) return null;

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        const colecao = tipo === 'motorista' ? 'motoristas_cadastros' : 'clientes';
        await updateDoc(doc(db, colecao, userId), {
          fcmToken: token,
          notificacoesAtivas: true,
          atualizadoEm: new Date()
        });
        return token;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static escutarNotificacoes(callback: (payload: any) => void) {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      callback(payload);
      this.tocarAlertaSonoro('alerta');
      if (payload.notification) {
        new Notification(payload.notification.title || 'Central FretoGo', {
          body: payload.notification.body,
          icon: '/icon-192.png'
        });
      }
    });
  }

  // 📱 API WHATSAPP - APROVAÇÃO DE FROTA
  static enviarWhatsAppAprovacao(telefone: string, nome: string, status: 'aprovado' | 'rejeitado') {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!telefoneLimpo) return;

    const mensagemAprovado = `🚚 *FRETOGO - Cadastro Aprovado!*\n\nParabéns ${nome}! Seu cadastro foi aprovado.\n\n✅ Acesse agora: https://app.fretogo.com.br/motorista\n\n📲 Baixe o app e ligue seu Radar para receber as cargas da sua região.\n\nDúvidas operacionais? Responda aqui.`;
    const mensagemRejeitado = `⚠️ *FRETOGO - Cadastro Pendente*\n\nOlá ${nome}, seu cadastro precisa de ajustes na Torre de Controle:\n\n📸 Envie novamente:\n• Foto da CNH (frente e verso legível)\n• Selfie segurando CNH\n• Documento do veículo\n\n🔗 Acesse: https://app.fretogo.com.br/motorista`;

    const mensagem = status === 'aprovado' ? mensagemAprovado : mensagemRejeitado;
    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

  // 📱 API WHATSAPP - NOTIFICAR CLIENTE (NOVA CARGA)
  static notificarClienteFretePostado(telefone: string, nome: string, idFrete: string) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!telefoneLimpo) return;

    const mensagem = `✅ *FRETOGO INFORMA*\n\nOlá ${nome}, seu frete #${idFrete.slice(0,6).toUpperCase()} já está ativo no nosso Radar Logístico.\n\nA nossa IA está analisando os motoristas parceiros num raio de 15km.\n\nVocê receberá um aviso assim que o veículo estiver a caminho da coleta!`;
    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  }

  // 📱 API WHATSAPP - NOTIFICAR CLIENTE (MOTORISTA ABORTOU)
  static notificarClienteMotoristaCancelou(telefone: string, nome: string, idFrete: string, motivo: string) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!telefoneLimpo) return;

    const mensagem = `⚠️ *ALERTA OPERACIONAL FRETOGO*\n\nOlá ${nome}. Tivemos um imprevisto com o veículo alocado para o frete #${idFrete.slice(0,6).toUpperCase()}.\n\n*Motivo reportado:* ${motivo}.\n\n🚨 *AÇÃO AUTOMÁTICA:* Nossa IA já devolveu sua carga para o topo do Radar com prioridade máxima. Outro parceiro assumirá a rota em breve.`;
    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  }
}
