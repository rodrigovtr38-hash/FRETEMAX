// =========================================================
// NOME DO ARQUIVO: src/services/orchestrator.ts
// CTO-Log: Arquivo Lápide (Stub). Auditoria LOTE 7.
// Status: Tipagem corrigida para aprovação de Build na Vercel.
// =========================================================

export interface MatchCriteria {
  categoria: string;
  origemLat: number;
  origemLng: number;
  destinoLat: number;
  destinoLng: number;
}

export const buildIntelligentQueue = async (criteria: MatchCriteria): Promise<string[]> => {
  console.warn("[CTO-Log] buildIntelligentQueue obsoleto chamado. Usar DispatchQueueService.", criteria);
  return [];
};

export const executeDispatch = async (freteId: string, freteData: MatchCriteria): Promise<boolean> => {
  console.warn("[CTO-Log] executeDispatch obsoleto chamado. Usar DispatchQueueService.", freteId, freteData);
  return false;
};

export const triggerRedispatch = async (freteId: string, motoristaIdFalho: string): Promise<boolean> => {
  console.warn("[CTO-Log] triggerRedispatch obsoleto chamado. Usar DispatchQueueService.", freteId, motoristaIdFalho);
  return false;
};
