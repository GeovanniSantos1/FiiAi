import { db } from '@/lib/db';

export interface AllocationValidationResult {
  isValid: boolean;
  totalAllocation: number;
  remainingAllocation: number;
  errorMessage?: string;
}

export interface TickerValidationResult {
  isValid: boolean;
  errorMessage?: string;
  existingFund?: {
    id: string;
    ticker: string;
    name: string;
  };
}

export interface PriceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that adding/updating a fund allocation doesn't exceed 100% for the portfolio
 */
export async function validatePortfolioAllocation(
  portfolioId: string,
  newAllocation: number,
  excludeFundId?: string
): Promise<AllocationValidationResult> {
  try {
    const existingFunds = await db.recommendedFund.findMany({
      where: {
        portfolioId,
        id: excludeFundId ? { not: excludeFundId } : undefined
      }
    });

    const currentTotalAllocation = existingFunds.reduce(
      (sum, fund) => sum + Number(fund.allocation),
      0
    );

    const totalAfterChange = currentTotalAllocation + newAllocation;
    const remainingAllocation = 100 - currentTotalAllocation;

    if (totalAfterChange > 100) {
      return {
        isValid: false,
        totalAllocation: totalAfterChange,
        remainingAllocation,
        errorMessage: `Alocação total excederia 100%. Alocação atual: ${currentTotalAllocation.toFixed(2)}%, disponível: ${remainingAllocation.toFixed(2)}%`
      };
    }

    return {
      isValid: true,
      totalAllocation: totalAfterChange,
      remainingAllocation: 100 - totalAfterChange
    };
  } catch (error) {
    console.error('Error validating portfolio allocation:', error);
    return {
      isValid: false,
      totalAllocation: 0,
      remainingAllocation: 0,
      errorMessage: 'Erro interno ao validar alocação'
    };
  }
}

/**
 * Validates that a ticker is unique within a portfolio
 */
export async function validateUniqueTickerInPortfolio(
  portfolioId: string,
  ticker: string,
  excludeFundId?: string
): Promise<TickerValidationResult> {
  try {
    const existingFund = await db.recommendedFund.findFirst({
      where: {
        portfolioId,
        ticker: ticker.toUpperCase(),
        id: excludeFundId ? { not: excludeFundId } : undefined
      },
      select: {
        id: true,
        ticker: true,
        name: true
      }
    });

    if (existingFund) {
      return {
        isValid: false,
        errorMessage: `O ticker ${ticker} já existe nesta carteira`,
        existingFund
      };
    }

    return {
      isValid: true
    };
  } catch (error) {
    console.error('Error validating unique ticker:', error);
    return {
      isValid: false,
      errorMessage: 'Erro interno ao validar ticker'
    };
  }
}

/**
 * Validates that a portfolio name is unique across all portfolios
 */
export async function validateUniquePortfolioName(
  name: string,
  excludePortfolioId?: string
): Promise<boolean> {
  try {
    const existingPortfolio = await db.recommendedPortfolio.findFirst({
      where: {
        name,
        id: excludePortfolioId ? { not: excludePortfolioId } : undefined
      }
    });

    return !existingPortfolio;
  } catch (error) {
    console.error('Error validating unique portfolio name:', error);
    return false;
  }
}

/**
 * Validates price relationships (current <= ceiling, average <= ceiling)
 */
export function validatePriceRelationships(
  currentPrice: number,
  averagePrice: number,
  ceilingPrice: number
): PriceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hard validation errors
  if (currentPrice > ceilingPrice) {
    errors.push('Preço atual não pode ser maior que o preço teto');
  }

  if (averagePrice > ceilingPrice) {
    errors.push('Preço médio não pode ser maior que o preço teto');
  }

  // Soft validation warnings
  if (currentPrice > averagePrice * 1.2) {
    warnings.push('Preço atual está 20% acima do preço médio');
  }

  if (currentPrice < averagePrice * 0.8) {
    warnings.push('Preço atual está 20% abaixo do preço médio');
  }

  const percentageFromCeiling = ((ceilingPrice - currentPrice) / ceilingPrice) * 100;
  if (percentageFromCeiling < 5) {
    warnings.push('Preço atual está muito próximo do teto (< 5% de diferença)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates that allocation distribution makes sense for portfolio diversity
 */
export async function validatePortfolioDiversity(portfolioId: string): Promise<{
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}> {
  try {
    const funds = await db.recommendedFund.findMany({
      where: { portfolioId }
    });

    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (funds.length === 0) {
      return { isValid: true, warnings: [], suggestions: [] };
    }

    // Check for concentration risk
    const allocations = funds.map(f => Number(f.allocation));
    const maxAllocation = Math.max(...allocations);

    if (maxAllocation > 30) {
      warnings.push(`Concentração alta: um fundo tem ${maxAllocation.toFixed(1)}% da carteira`);
      suggestions.push('Considere diversificar mais a carteira para reduzir riscos');
    }

    // Check for segment diversity
    const segments = [...new Set(funds.map(f => f.segment))];
    if (segments.length === 1 && funds.length > 1) {
      warnings.push('Todos os fundos são do mesmo segmento');
      suggestions.push('Considere adicionar fundos de outros segmentos para diversificação');
    }

    // Check for too many small allocations
    const smallAllocations = allocations.filter(a => a < 5).length;
    if (smallAllocations > funds.length / 2) {
      warnings.push('Muitos fundos com alocação pequena (< 5%)');
      suggestions.push('Considere consolidar em menos fundos com alocações maiores');
    }

    // Check recommendation distribution
    const recommendations = funds.reduce((acc, fund) => {
      acc[fund.recommendation] = (acc[fund.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (recommendations.SELL && !recommendations.BUY) {
      warnings.push('Carteira tem apenas recomendações de venda/aguardar');
      suggestions.push('Considere adicionar fundos com recomendação de compra');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  } catch (error) {
    console.error('Error validating portfolio diversity:', error);
    return {
      isValid: false,
      warnings: ['Erro ao validar diversificação da carteira'],
      suggestions: []
    };
  }
}

/**
 * Business rule: validates that a portfolio is ready for activation
 */
export async function validatePortfolioReadiness(portfolioId: string): Promise<{
  isReady: boolean;
  blockers: string[];
  warnings: string[];
}> {
  try {
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: portfolioId },
      include: {
        funds: true,
        _count: { select: { funds: true } }
      }
    });

    if (!portfolio) {
      return {
        isReady: false,
        blockers: ['Carteira não encontrada'],
        warnings: []
      };
    }

    const blockers: string[] = [];
    const warnings: string[] = [];

    // Must have at least one fund
    if (portfolio.funds.length === 0) {
      blockers.push('Carteira deve ter pelo menos um fundo');
    }

    // Check total allocation
    const totalAllocation = portfolio.funds.reduce(
      (sum, fund) => sum + Number(fund.allocation),
      0
    );

    if (totalAllocation === 0) {
      blockers.push('Carteira deve ter alocação total > 0%');
    }

    if (totalAllocation > 100) {
      blockers.push('Alocação total não pode exceder 100%');
    }

    // Warnings for best practices
    if (totalAllocation < 95) {
      warnings.push(`Alocação total é ${totalAllocation.toFixed(1)}% - considere alocar mais`);
    }

    if (portfolio.funds.length === 1) {
      warnings.push('Carteira com apenas um fundo - considere diversificar');
    }

    // Check for funds with recommendation but no allocation
    const fundsWithoutAllocation = portfolio.funds.filter(
      f => f.recommendation === 'BUY' && Number(f.allocation) === 0
    );

    if (fundsWithoutAllocation.length > 0) {
      warnings.push('Fundos recomendados para compra sem alocação');
    }

    return {
      isReady: blockers.length === 0,
      blockers,
      warnings
    };
  } catch (error) {
    console.error('Error validating portfolio readiness:', error);
    return {
      isReady: false,
      blockers: ['Erro interno ao validar carteira'],
      warnings: []
    };
  }
}

/**
 * Get portfolio health score (0-100)
 */
export async function calculatePortfolioHealthScore(portfolioId: string): Promise<{
  score: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
}> {
  try {
    const portfolio = await db.recommendedPortfolio.findUnique({
      where: { id: portfolioId },
      include: { funds: true }
    });

    if (!portfolio || portfolio.funds.length === 0) {
      return {
        score: 0,
        factors: [{
          name: 'Fundos',
          score: 0,
          weight: 100,
          description: 'Carteira sem fundos'
        }]
      };
    }

    const factors = [];

    // 1. Allocation completeness (20%)
    const totalAllocation = portfolio.funds.reduce((sum, f) => sum + Number(f.allocation), 0);
    const allocationScore = Math.min(100, (totalAllocation / 100) * 100);
    factors.push({
      name: 'Alocação Completa',
      score: allocationScore,
      weight: 20,
      description: `${totalAllocation.toFixed(1)}% alocado`
    });

    // 2. Diversification (25%)
    const segments = [...new Set(portfolio.funds.map(f => f.segment))];
    const diversificationScore = Math.min(100, (segments.length / Math.min(portfolio.funds.length, 5)) * 100);
    factors.push({
      name: 'Diversificação',
      score: diversificationScore,
      weight: 25,
      description: `${segments.length} segmentos diferentes`
    });

    // 3. Concentration risk (20%)
    const maxAllocation = Math.max(...portfolio.funds.map(f => Number(f.allocation)));
    const concentrationScore = Math.max(0, 100 - (maxAllocation > 30 ? (maxAllocation - 30) * 2 : 0));
    factors.push({
      name: 'Concentração',
      score: concentrationScore,
      weight: 20,
      description: `Maior alocação: ${maxAllocation.toFixed(1)}%`
    });

    // 4. Recommendation quality (20%)
    const buyFunds = portfolio.funds.filter(f => f.recommendation === 'BUY').length;
    const recommendationScore = Math.min(100, (buyFunds / portfolio.funds.length) * 150);
    factors.push({
      name: 'Qualidade das Recomendações',
      score: recommendationScore,
      weight: 20,
      description: `${buyFunds} fundos recomendados para compra`
    });

    // 5. Price opportunity (15%)
    const fundsAtGoodPrice = portfolio.funds.filter(f => {
      const current = Number(f.currentPrice);
      const ceiling = Number(f.ceilingPrice);
      return current <= ceiling * 0.9; // 10% below ceiling
    }).length;
    const priceScore = (fundsAtGoodPrice / portfolio.funds.length) * 100;
    factors.push({
      name: 'Oportunidade de Preço',
      score: priceScore,
      weight: 15,
      description: `${fundsAtGoodPrice} fundos com bom preço`
    });

    // Calculate weighted score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore = factors.reduce((sum, f) => sum + (f.score * f.weight), 0) / totalWeight;

    return {
      score: Math.round(weightedScore),
      factors
    };
  } catch (error) {
    console.error('Error calculating portfolio health score:', error);
    return {
      score: 0,
      factors: [{
        name: 'Erro',
        score: 0,
        weight: 100,
        description: 'Erro ao calcular score'
      }]
    };
  }
}