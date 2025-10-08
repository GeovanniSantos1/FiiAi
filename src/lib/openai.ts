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
      "Logístico": [percentual],
      "Corporativo": [percentual],
      "Shopping": [percentual],
      "Papel": [percentual],
      "Outros": [percentual]
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