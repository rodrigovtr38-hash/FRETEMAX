// ============================================================================
// ARQUIVO: src/core/ai/analytics/ia.metrics.ts
// PASTA: src/core/ai/analytics/
// CTO-Log: FASE 3 - BLOCO 3 (Dashboard e KPIs Limpos)
// Status: Sink Buraco-Negro corrigido e Motor de Resumo para o Admin ativado.
// ============================================================================

import { writeBatch, doc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase';

export type DriverIntent = 'FREIGHT_SEARCH' | 'SUPPORT' | 'FINANCIAL' | 'GENERAL_CHAT';

export interface AIMetricPayload {
  userId: string;
  operationId: string;
  tokensUsed: number;
  estimatedCostUsd: number;
  latencyMs: number;
  detectedIntent: DriverIntent; 
  timestamp?: string;
}

class FTIAnalyticsEngine {
  private metricsBuffer: AIMetricPayload[] = [];
  private readonly BATCH_SIZE = 10; 

  public logOperation(metric: AIMetricPayload): void {
    const fullMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metricsBuffer.push(fullMetric);
    console.info(`[FTI Telemetry] Op: ${fullMetric.operationId} | Intenção: ${fullMetric.detectedIntent} | Custo: $${fullMetric.estimatedCostUsd.toFixed(6)}`);

    if (this.metricsBuffer.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
  }

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
      this.metricsBuffer = [];
    }
  }

  // --- 2. ALIMENTAÇÃO DO ADMIN (MÉTRICAS MASTIGADAS) ---

  /**
   * Puxa as últimas métricas do banco e entrega os números calculados para a tela de Administração.
   */
  public async obterResumoAdmin(): Promise<{
    custoTotalUsd: number;
    intencoes: Record<DriverIntent, number>;
    totalInteracoes: number;
  }> {
    try {
      const logsRef = collection(db, 'analytics_ia_logs');
      // Puxa as últimas 500 interações neurais
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(500));
      const snapshot = await getDocs(q);

      let custoTotalUsd = 0;
      let totalInteracoes = 0;
      const intencoes = {
        FREIGHT_SEARCH: 0,
        SUPPORT: 0,
        FINANCIAL: 0,
        GENERAL_CHAT: 0
      };

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as AIMetricPayload;
        custoTotalUsd += data.estimatedCostUsd || 0;
        totalInteracoes++;
        if (intencoes[data.detectedIntent] !== undefined) {
          intencoes[data.detectedIntent]++;
        }
      });

      return { custoTotalUsd, intencoes, totalInteracoes };
    } catch (error) {
      console.error('[FTI Analytics] Falha ao gerar resumo pro Admin:', error);
      return {
        custoTotalUsd: 0,
        totalInteracoes: 0,
        intencoes: { FREIGHT_SEARCH: 0, SUPPORT: 0, FINANCIAL: 0, GENERAL_CHAT: 0 }
      };
    }
  }
}

export const ftiAnalytics = new FTIAnalyticsEngine();
