// ============================================================================
// ARQUIVO: ia.metrics.ts
// PASTA: src/core/ai/analytics/
// OBJETIVO: Motor de Telemetria FTI - Auditoria de Custos e Inteligência de Tráfego
// ============================================================================

// Categorização brutal das intenções para retroalimentar o Meta Ads e Google Ads
export type DriverIntent = 'FREIGHT_SEARCH' | 'SUPPORT' | 'FINANCIAL' | 'GENERAL_CHAT';

export interface AIMetricPayload {
  userId: string;
  operationId: string;
  tokensUsed: number;
  estimatedCostUsd: number; // Trava de controle de margem de lucro do SaaS
  latencyMs: number;
  detectedIntent: DriverIntent; // Ouro puro para a equipe de marketing
  timestamp?: string;
}

class FTIAnalyticsEngine {
  private metricsBuffer: AIMetricPayload[] = [];
  private readonly BATCH_SIZE = 10; // Acumula 10 logs antes de enviar para não travar a internet do motorista

  /**
   * Registra a operação da IA. 
   * Extrai o custo e a intenção do motorista para nosso Data Lake.
   */
  public logOperation(metric: AIMetricPayload): void {
    const fullMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metricsBuffer.push(fullMetric);
    
    // Log tático para auditoria no console (DevMode)
    console.info(`[FTI Telemetry] Op: ${fullMetric.operationId} | Intenção: ${fullMetric.detectedIntent} | Custo: $${fullMetric.estimatedCostUsd.toFixed(6)}`);

    // Dispara para o banco de dados apenas quando o lote estiver cheio (Otimização de rede)
    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

  /**
   * Descarrega os dados.
   * No futuro, este método enviará o JSON direto para o nosso sistema de BI.
   */
  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return;

    console.log(`[FTI Data Lake] Sincronizando ${this.metricsBuffer.length} pacotes de dados logísticos...`);
    
    // Limpa a memória RAM após o envio
    this.metricsBuffer = [];
  }
}

// Singleton exportado para uso global
export const ftiAnalytics = new FTIAnalyticsEngine();
