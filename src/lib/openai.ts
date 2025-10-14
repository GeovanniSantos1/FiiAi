import OpenAI from "openai";
import { db } from './db';
import { readFileSync } from 'fs';
import { join } from 'path';

// Using the javascript_openai blueprint integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load the FiiAi prompt
const FIIAI_PROMPT = readFileSync(
  join(process.cwd(), 'docs', 'prompt-ia-avaliador-carteiras.md'),
  'utf-8'
);

export interface FIIAnalysisResult {
  overallScore: number;
  riskLevel: 'BAIXO' | 'MODERADO' | 'ALTO';
  diversificationScore: number;
  concentrationRisk: number;
  sectorAnalysis: {
    distribution: Record<string, number>;
    recommendations: string[];
  };
  performanceAnalysis: {
    totalValue: number;
    strongPositions: string[];
    weakPositions: string[];
  };
  recommendations: string[];
  summary: string;
}

export interface PortfolioData {
  positions: {
    fiiCode: string;
    quantity: number;
    avgPrice: number;
    currentValue: number;
    percentage: number;
  }[];
  totalValue: number;
}

export async function analyzeFIIPortfolio(portfolioData: PortfolioData): Promise<FIIAnalysisResult> {
  try {
    // Get active recommendation rules from database
    const activeRules = await db.recommendationRuleSet.findFirst({
      where: { isActive: true },
      select: { rules: true }
    });

    if (!activeRules) {
      throw new Error('No active recommendation rules found. Please configure rules in admin panel.');
    }

    const prompt = `
${FIIAI_PROMPT}

=== CLASSIFICAÇÃO DE SETORES DE FIIs ===
Identifique corretamente o setor de cada FII da carteira usando as categorias abaixo:

- **Lajes**: FIIs de lajes corporativas (escritórios) - Ex: HGRE11, HGLG11, BRCR11, JSRE11, CPTS11
- **Logística**: FIIs de galpões logísticos - Ex: HGBS11, BTLG11, LVBI11, XPLG11, VILG11
- **Shopping**: FIIs de shopping centers - Ex: HGBS11, VISC11, XPML11, MALL11, ALSO11
- **Varejo/renda urbana**: FIIs de imóveis de varejo e renda urbana - Ex: KNRI11, PVBI11,URBS
- **Papel**: FIIs de recebíveis imobiliários e CRIs - Ex: MCCI11, JSAF11, RBRR11, KNCR11, BCFF11
- **Hedge Funds**: FIIs multimercado e híbridos - Ex: HGFF11
- **Educacional**: FIIs de escolas e universidades
- **Híbridos**: FIIs com estratégia mista (tijolo + papel) - Ex: PVBI11, KFOF11
- **Agro**: FIIs focados em agronegócio
- **Infra**: FIIs de infraestrutura (energia, telecomunicações)
- **Desenvolvimento**: FIIs focados em desenvolvimento imobiliário
- **Hospitais**: FIIs de hospitais e clínicas - Ex: NSLU11
- **Hotéis**: FIIs de hotéis e resorts - Ex: HTMX11
- **Agências**: FIIs de agências bancárias
- **Residencial**: FIIs residenciais
- **Outros**: FIIs que não se encaixam nas categorias acima

IMPORTANTE: 
1. Pesquise o ticker do FII e classifique-o no setor correto
2. Apenas coloque em "Outros" se realmente não souber a classificação
3. A soma de todos os percentuais em "distribution" deve ser exatamente 100%
4. Inclua APENAS os setores que existem na carteira do usuário (omita setores com 0%)

=== REGRAS ATIVAS DO SISTEMA ===
${JSON.stringify(activeRules.rules, null, 2)}

=== DADOS DO PORTFÓLIO DO USUÁRIO ===
${JSON.stringify(portfolioData, null, 2)}

Por favor, analise a carteira seguindo EXATAMENTE a metodologia descrita no prompt acima.

IMPORTANTE: Responda APENAS em formato JSON com a seguinte estrutura (mantenha compatibilidade com o sistema):
{
  "overallScore": [nota de 0 a 100 baseada nas regras],
  "riskLevel": "BAIXO" | "MODERADO" | "ALTO",
  "diversificationScore": [nota de 0 a 100],
  "concentrationRisk": [percentual do maior ativo],
  "sectorAnalysis": {
    "distribution": {
      "Lajes": [percentual],
      "Logística": [percentual],
      "Shopping": [percentual],
      "Varejo/renda urbana": [percentual],
      "Papel": [percentual],
      "Hedge Funds": [percentual],
      "Educacional": [percentual],
      "Híbridos": [percentual],
      "Agro": [percentual],
      "Infra": [percentual],
      "Desenvolvimento": [percentual],
      "Hospitais": [percentual],
      "Hotéis": [percentual],
      "Agências": [percentual],
      "Residencial": [percentual],
      "Outros": [percentual para FIIs que não se encaixam em nenhuma categoria acima]
    },
    "recommendations": ["Use as 8 seções do relatório conforme metodologia FiiAi"]
  },
  "performanceAnalysis": {
    "totalValue": [valor total da carteira],
    "strongPositions": ["FIIs recomendados que ele possui"],
    "weakPositions": ["FIIs não recomendados ou em segmentos proibidos"]
  },
  "recommendations": [
    "Priorize recomendações conforme seção 6 do prompt (Recomendações Prioritárias)"
  ],
  "summary": "Use o formato da seção 1 (Resumo Executivo) - 3-5 linhas com visão geral"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em análise de Fundos de Investimento Imobiliário (FII) brasileiro. Responda sempre em formato JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as FIIAnalysisResult;
  } catch (error) {
    console.error('Erro na análise FII:', error);
    throw new Error(`Falha na análise da carteira: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export async function generateInvestmentRecommendations(
  portfolioData: PortfolioData,
  userProfile: {
    investmentGoal: 'RENDA' | 'CRESCIMENTO' | 'BALANCEADO';
    riskTolerance: 'CONSERVADOR' | 'MODERADO' | 'ARROJADO';
    monthlyInvestment: number;
    preferences?: string;
  }
): Promise<{
  recommendations: Array<{
    fiiCode: string;
    suggestedAmount: number;
    reason: string;
    priority: 'ALTA' | 'MÉDIA' | 'BAIXA';
  }>;
  strategy: string;
  expectedYield: number;
}> {
  try {
    const prompt = `
Você é um consultor especialista em FII brasileiro. Com base na carteira atual e perfil do investidor, 
sugira os próximos aportes.

CARTEIRA ATUAL:
${JSON.stringify(portfolioData, null, 2)}

PERFIL DO INVESTIDOR:
- Objetivo: ${userProfile.investmentGoal}
- Tolerância ao risco: ${userProfile.riskTolerance}
- Aporte mensal: R$ ${userProfile.monthlyInvestment.toFixed(2)}
${userProfile.preferences ? `- Preferências específicas: ${userProfile.preferences}` : ''}

Considere:
1. Diversificação setorial
2. Rebalanceamento da carteira
3. Potencial de crescimento
4. Yield histórico
5. Qualidade da gestão
${userProfile.preferences ? '6. As preferências específicas do investidor mencionadas acima' : ''}

Responda APENAS em formato JSON:
{
  "recommendations": [
    {
      "fiiCode": "CODIGO11",
      "suggestedAmount": [valor em R$],
      "reason": "Motivo da recomendação",
      "priority": "ALTA" | "MÉDIA" | "BAIXA"
    }
  ],
  "strategy": "Estratégia geral para os próximos aportes",
  "expectedYield": [yield esperado em %]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Você é um consultor especialista em FII brasileiro. Responda sempre em formato JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Erro na geração de recomendações:', error);
    throw new Error(`Falha na geração de recomendações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}