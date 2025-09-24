import OpenAI from "openai";

// Using the javascript_openai blueprint integration
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const prompt = `
Você é um especialista em análise de Fundos de Investimento Imobiliário (FII) brasileiro. 
Analise a carteira abaixo e forneça uma avaliação completa.

DADOS DA CARTEIRA:
${JSON.stringify(portfolioData, null, 2)}

Analise considerando:

1. DIVERSIFICAÇÃO:
- Número de FIIs na carteira
- Distribuição percentual entre os ativos
- Concentração em poucos ativos

2. TIPOS DE FII:
- FIIs de tijolo (imóveis físicos)
- FIIs de papel (CRI, LCI, etc.)
- FIIs de fundos (FOF)
- FIIs híbridos

3. SETORES:
- Logístico
- Corporativo
- Shopping Centers
- Residencial
- Hospitalar/Educacional
- Outros

4. ANÁLISE DE RISCO:
- Concentração por ativo
- Diversificação setorial
- Qualidade dos gestores

Responda APENAS em formato JSON com a seguinte estrutura:
{
  "overallScore": [nota de 0 a 100],
  "riskLevel": "BAIXO" | "MODERADO" | "ALTO",
  "diversificationScore": [nota de 0 a 100],
  "concentrationRisk": [percentual do maior ativo],
  "sectorAnalysis": {
    "distribution": {
      "Logístico": [percentual],
      "Corporativo": [percentual],
      "Shopping": [percentual],
      "Residencial": [percentual],
      "Papel": [percentual],
      "Outros": [percentual]
    },
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "performanceAnalysis": {
    "totalValue": [valor total da carteira],
    "strongPositions": ["FII1", "FII2"],
    "weakPositions": ["FII3", "FII4"]
  },
  "recommendations": [
    "Recomendação específica 1",
    "Recomendação específica 2", 
    "Recomendação específica 3"
  ],
  "summary": "Resumo executivo da análise em 2-3 frases"
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

Considere:
1. Diversificação setorial
2. Rebalanceamento da carteira
3. Potencial de crescimento
4. Yield histórico
5. Qualidade da gestão

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