// ============================================================================
// ARQUIVO: ia.format.ts
// PASTA: src/core/ai/utils/
// OBJETIVO: Motor de Formatação e Sanitização de Dados Logísticos (Produção V1)
// ============================================================================

/**
 * Converte valores numéricos brutos para o padrão BRL (R$).
 * Possui trava de segurança contra valores nulos ou inválidos (NaN).
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'R$ 0,00'; // Fallback de segurança para não quebrar o UI
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value));
};

/**
 * Formata peso logístico em Toneladas.
 * Exemplo: 35.5 -> "35,50 t"
 */
export const formatWeight = (weightInTons: number | string | null): string => {
  if (!weightInTons || Number.isNaN(Number(weightInTons))) return '0,00 t';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(weightInTons)) + ' t';
};

/**
 * Retorna a data/hora oficial no fuso horário do Brasil (Regra Magna de Auditoria).
 */
export const getLogisticsTimestamp = (): string => {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};
