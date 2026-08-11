// ============================================================================
// ARQUIVO: src/core/ai/knowledge/ia.rules.ts
// CTO-Log: FASE 3 - Inteligência Viva (BLOCO 2)
// Status: Injeção da Tabela ANTT e Markup B2B na memória base da plataforma.
// ============================================================================

export const FTI_RULES_GUIDELINES = `
# ⚖️ FTI - Regras de Negócio e Operações (Bíblia Operacional)

## 1. SISTEMA DE PAGAMENTO (ESCROW - MERCADO PAGO)
- **Regra de Ouro:** TODO E QUALQUER frete negociado na plataforma deve ser pago via sistema Escrow (Pagamento Seguro).
- **Como funciona:** O Embarcador deposita o valor na FretoGo no momento do fechamento. O dinheiro fica "retido e seguro". O Motorista só recebe quando o Embarcador confirmar a entrega no aplicativo ou via comprovante (canhoto assinado/POD).
- **Vantagem:** Segurança de entrega para o Embarcador e garantia de recebimento (zero calote) para o Motorista.

## 2. PROIBIÇÃO DE NEGOCIAÇÃO EXTERNA (BYPASS)
- É estritamente proibido trocar contatos (WhatsApp, telefone, e-mail) para fechar fretes "por fora".
- Punição: Ausência de seguro de carga e bloqueio na plataforma.

## 3. PRECIFICADOR INTELIGENTE (TABELA ANTT SUGERIDA)
A FTI não impõe preço, ela gera uma "Sugestão Justa" ancorada na realidade da estrada (Google Maps).
O Cálculo é composto por 4 Pilares:

**Pilar A: Distância e Trava de Segurança**
- Leitura exata da rota via GPS. Se a rota der menos de 15km, cobra-se o mínimo equivalente a 15km.

**Pilar B: Fator de Veículo (Pagamento Base do Motorista)**
- Carro Pequeno: R$ 100 base. Após 15km, + R$ 4/km.
- Utilitário (VUC/Fiorino/HR): R$ 180 base. Após 15km, + R$ 6/km.
- Toco: R$ 350 base. Após 15km, + R$ 7/km.
- Truck: R$ 550 base. Após 15km, + R$ 8,50/km.
- Carreta LS: Sem base de 15km. R$ 10,50/km (Mínimo absoluto: R$ 1.200).
- Bi-trem / Cegonha: Sem base de 15km. R$ 12,50/km (Mínimo absoluto: R$ 1.800).
- Risco MOPP/Química: Sobretaxa de +20% no valor do motorista.
- Paradas Extras: + R$ 150 por parada (Caminhões Pesados) ou + R$ 8 por parada (Veículos Leves).

**Pilar C: Taxa da Plataforma (Take Rate)**
O lucro da FretoGo já é embutido na sugestão do Embarcador através do Markup (Divisor).
- Pesados (Toco a Bi-Trem): Divisor 0.85 (FretoGo retém 15%).
- Leves (Moto a Utilitário): Divisor 0.80 (FretoGo retém 20%).

**Pilar D: Pedágio Realista (Toll Cost)**
- Distância < 40km: R$ 0 de pedágio.
- Distância > 40km (Pesados): + R$ 0,85 por km rodado.
- Distância > 40km (Leves): + R$ 0,35 por km rodado.

## 4. O TERMÔMETRO DE OFERTA E INTERVENÇÃO FTI
- A FTI monitora o Radar. Se a carga expirar (30 min) sem aceite, a FTI deve usar o cálculo acima para alertar o Embarcador que o valor ofertado está abaixo da "Tabela Sugerida ANTT" e sugerir o "Auto-Bid" (aumento de preço).

## 5. CANCELAMENTOS
- Se o Embarcador cancelar o frete após o motorista se deslocar para a coleta, uma taxa de "Diária/Deslocamento" deverá ser paga ao motorista usando os fundos em Escrow.
`;
