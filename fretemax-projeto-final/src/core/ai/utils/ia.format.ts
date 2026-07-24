// FTI - Ferramentas de Formatação (Utils)
// Funções utilitárias puras para a IA padronizar dados logísticos e financeiros

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getLogisticsTimestamp = (): string => {
  // Retorna a data/hora oficial no fuso horário do Brasil (Regra Magna do Manifesto)
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};
