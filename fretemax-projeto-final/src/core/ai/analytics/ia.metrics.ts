// ============================================================================
// ARQUIVO: ia.metrics.ts
// PASTA: src/core/ai/analytics/
// CTO-Log: FASE 2 - Homologação Operacional.
// Status: Sink Buraco-Negro corrigido. Dados de telemetria agora são gravados no Firestore via Batch.
// ============================================================================

import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '../../../firebase';

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
   * Descarrega os dados no Firestore garantindo a Single Source of Truth para Auditoria Financeira.
   */
  public async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    console.log(`[FTI Data Lake] Sincronizando ${this.metricsBuffer.length} pacotes de telemetria...`);
    
    try {
      const batch = writeBatch(db);
      
      this.metricsBuffer.forEach(metric => {
        const docRef = doc(collection(db, 'analytics_ia_logs'));
        batch.set(docRef, metric);
      });

      await batch.commit();
      console.log(`[FTI Data Lake] Telemetria salva no Banco de Dados com sucesso.`);
    } catch (error) {
      console.error(`[FTI Data Lake] Erro crítico ao salvar telemetria da IA:`, error);
    } finally {
      // Limpa a memória RAM de forma segura
      this.metricsBuffer = [];
    }
  }
}

// Singleton exportado para uso global
export const ftiAnalytics = new FTIAnalyticsEngine();
