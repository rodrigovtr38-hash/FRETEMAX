// ============================================================================
// ARQUIVO: ia.context.ts
// PASTA: src/core/ai/types/
// OBJETIVO: Contrato de Contexto Global - Consciência Situacional da IA
// ============================================================================

/**
 * Localização tática. Crucial para roteamento inteligente e lances regionais de tráfego (Google Ads local).
 */
export interface LocationContext {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  accuracy?: number; // Precisão do GPS em metros (evita que a IA sugira rotas baseada em pings de antena falsos)
}

/**
 * Mapeamento brutal da jornada do usuário. 
 * A IA precisa saber exatamente o contexto visual para fechar vendas ou reter o usuário.
 */
export interface AppScreenContext {
  currentScreen: 'dashboard' | 'fretes_disponiveis' | 'detalhe_frete' | 'viagem_ativa' | 'carteira' | 'assinatura_planos' | 'suporte_emergencia';
  activeOperationId?: string; // ID do frete/transação em andamento
  vehicleCategory?: string;   // Fator multiplicador de preço financeiro (ex: rodotrem vs toco)
  timeOnScreenMs?: number;    // Telemetria de retenção: se o usuário trava na tela de pagamento, a IA intervém.
}

/**
 * Estado operacional do dispositivo do motorista (Realidade do campo).
 */
export interface DeviceContext {
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline'; // Dita se a IA manda JSONs pesados ou apenas texto bruto
  batteryLevel: number;
}

/**
 * O pacote master que a memória RAM do app vai injetar no motor Gemini a cada requisição.
 */
export interface FullAIContext {
  location: LocationContext | null;
  appState: AppScreenContext;
  device: DeviceContext;
}
