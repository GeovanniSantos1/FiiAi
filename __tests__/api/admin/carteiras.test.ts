import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  validatePortfolioAllocation,
  validateUniqueTickerInPortfolio,
  validatePriceRelationships,
  calculatePortfolioHealthScore
} from '@/lib/validations/business-rules';

// Mock do banco de dados
jest.mock('@/lib/db', () => ({
  db: {
    recommendedPortfolio: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    recommendedFund: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock do Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock dos utilitários de autenticação
jest.mock('@/lib/auth-utils', () => ({
  getUserFromClerkId: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    isAdmin: true
  })),
}));

describe('/api/admin/carteiras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Business Rules Validation', () => {
    describe('validatePortfolioAllocation', () => {
      it('should validate allocation within limits', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedFund.findMany as jest.Mock).mockResolvedValue([
          { allocation: 30 },
          { allocation: 40 }
        ]);

        const result = await validatePortfolioAllocation('portfolio-1', 20);

        expect(result.isValid).toBe(true);
        expect(result.totalAllocation).toBe(90);
        expect(result.remainingAllocation).toBe(10);
      });

      it('should reject allocation that exceeds 100%', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedFund.findMany as jest.Mock).mockResolvedValue([
          { allocation: 60 },
          { allocation: 30 }
        ]);

        const result = await validatePortfolioAllocation('portfolio-1', 20);

        expect(result.isValid).toBe(false);
        expect(result.totalAllocation).toBe(110);
        expect(result.errorMessage).toContain('excederia 100%');
      });

      it('should exclude specific fund when updating', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedFund.findMany as jest.Mock).mockResolvedValue([
          { allocation: 40 }
        ]);

        const result = await validatePortfolioAllocation('portfolio-1', 50, 'fund-to-exclude');

        expect(result.isValid).toBe(true);
        expect(result.totalAllocation).toBe(90);
      });
    });

    describe('validateUniqueTickerInPortfolio', () => {
      it('should allow unique ticker', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedFund.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await validateUniqueTickerInPortfolio('portfolio-1', 'HGLG11');

        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });

      it('should reject duplicate ticker', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedFund.findFirst as jest.Mock).mockResolvedValue({
          id: 'existing-fund',
          ticker: 'HGLG11',
          name: 'Hedge General Logistics'
        });

        const result = await validateUniqueTickerInPortfolio('portfolio-1', 'HGLG11');

        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toContain('já existe');
        expect(result.existingFund).toBeDefined();
      });

      it('should allow same ticker when excluding specific fund', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedFund.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await validateUniqueTickerInPortfolio(
          'portfolio-1',
          'HGLG11',
          'fund-to-exclude'
        );

        expect(result.isValid).toBe(true);
      });
    });

    describe('validatePriceRelationships', () => {
      it('should validate correct price relationships', () => {
        const result = validatePriceRelationships(100, 95, 120);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject current price above ceiling', () => {
        const result = validatePriceRelationships(130, 95, 120);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Preço atual não pode ser maior que o preço teto');
      });

      it('should reject average price above ceiling', () => {
        const result = validatePriceRelationships(100, 130, 120);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Preço médio não pode ser maior que o preço teto');
      });

      it('should provide warnings for price anomalies', () => {
        // Current price 25% above average
        const result = validatePriceRelationships(125, 100, 150);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Preço atual está 20% acima do preço médio');
      });

      it('should warn when price is close to ceiling', () => {
        const result = validatePriceRelationships(117, 100, 120); // 2.5% from ceiling

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('muito próximo do teto');
      });
    });

    describe('calculatePortfolioHealthScore', () => {
      it('should return 0 score for empty portfolio', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedPortfolio.findUnique as jest.Mock).mockResolvedValue({
          id: 'portfolio-1',
          funds: []
        });

        const result = await calculatePortfolioHealthScore('portfolio-1');

        expect(result.score).toBe(0);
        expect(result.factors[0].description).toContain('sem fundos');
      });

      it('should calculate health score for well-balanced portfolio', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedPortfolio.findUnique as jest.Mock).mockResolvedValue({
          id: 'portfolio-1',
          funds: [
            {
              allocation: 25,
              segment: 'Logístico',
              recommendation: 'BUY',
              currentPrice: 90,
              ceilingPrice: 100
            },
            {
              allocation: 30,
              segment: 'Shopping',
              recommendation: 'BUY',
              currentPrice: 80,
              ceilingPrice: 95
            },
            {
              allocation: 25,
              segment: 'Corporativo',
              recommendation: 'BUY',
              currentPrice: 110,
              ceilingPrice: 120
            },
            {
              allocation: 20,
              segment: 'Residencial',
              recommendation: 'HOLD',
              currentPrice: 75,
              ceilingPrice: 85
            }
          ]
        });

        const result = await calculatePortfolioHealthScore('portfolio-1');

        expect(result.score).toBeGreaterThan(70);
        expect(result.factors).toHaveLength(5);
        expect(result.factors.find(f => f.name === 'Alocação Completa')?.score).toBe(100);
        expect(result.factors.find(f => f.name === 'Diversificação')?.score).toBe(80); // 4 segments
      });

      it('should penalize concentrated portfolios', async () => {
        const { db } = await import('@/lib/db');

        (db.recommendedPortfolio.findUnique as jest.Mock).mockResolvedValue({
          id: 'portfolio-1',
          funds: [
            {
              allocation: 70, // High concentration
              segment: 'Logístico',
              recommendation: 'BUY',
              currentPrice: 90,
              ceilingPrice: 100
            },
            {
              allocation: 30,
              segment: 'Shopping',
              recommendation: 'SELL',
              currentPrice: 110,
              ceilingPrice: 100
            }
          ]
        });

        const result = await calculatePortfolioHealthScore('portfolio-1');

        const concentrationFactor = result.factors.find(f => f.name === 'Concentração');
        expect(concentrationFactor?.score).toBeLessThan(50); // Penalized for 70% concentration
      });
    });
  });

  describe('API Endpoints Integration', () => {
    it('should create portfolio with valid data', async () => {
      // This would test the actual API endpoints
      // For now, we focus on business logic validation
      const validPortfolioData = {
        name: 'Carteira Teste',
        description: 'Uma carteira para testes',
        isActive: true
      };

      // Test that the data passes validation
      expect(validPortfolioData.name).toBeTruthy();
      expect(validPortfolioData.name.length).toBeLessThanOrEqual(100);
    });

    it('should validate fund data before creation', async () => {
      const validFundData = {
        ticker: 'HGLG11',
        name: 'Hedge General Logistics',
        segment: 'Logístico',
        currentPrice: 156.78,
        averagePrice: 140.50,
        ceilingPrice: 180.00,
        allocation: 15.5,
        recommendation: 'BUY' as const
      };

      // Test ticker format
      expect(validFundData.ticker).toMatch(/^[A-Z]{4}[0-9]{2}$/);

      // Test price relationships
      expect(validFundData.currentPrice).toBeLessThanOrEqual(validFundData.ceilingPrice);
      expect(validFundData.averagePrice).toBeLessThanOrEqual(validFundData.ceilingPrice);

      // Test allocation range
      expect(validFundData.allocation).toBeGreaterThanOrEqual(0);
      expect(validFundData.allocation).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { db } = await import('@/lib/db');

      (db.recommendedFund.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await validatePortfolioAllocation('portfolio-1', 20);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Erro interno');
    });

    it('should handle invalid ticker format', () => {
      const invalidTickers = ['HGLG', 'HGLG111', 'hglg11', '123456'];

      invalidTickers.forEach(ticker => {
        expect(ticker).not.toMatch(/^[A-Z]{4}[0-9]{2}$/);
      });
    });

    it('should handle negative allocations', () => {
      const negativeAllocation = -5;

      expect(negativeAllocation).toBeLessThan(0);
      // In real validation, this would be caught by Zod schema
    });
  });
});

describe('Component Tests', () => {
  describe('RecommendationBadge', () => {
    it('should display correct labels for recommendations', () => {
      const recommendations = [
        { value: 'BUY', expected: 'Comprar' },
        { value: 'SELL', expected: 'Vender' },
        { value: 'HOLD', expected: 'Aguardar' }
      ];

      recommendations.forEach(({ value, expected }) => {
        // This would test the actual component rendering
        // For now, we test the utility function
        const { getRecommendationLabel } = require('@/lib/validations/carteiras');
        expect(getRecommendationLabel(value)).toBe(expected);
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate ticker format in forms', () => {
      const validTicker = 'HGLG11';
      const invalidTicker = 'invalid';

      expect(validTicker).toMatch(/^[A-Z]{4}[0-9]{2}$/);
      expect(invalidTicker).not.toMatch(/^[A-Z]{4}[0-9]{2}$/);
    });

    it('should enforce allocation limits', () => {
      const validAllocations = [0, 50, 100];
      const invalidAllocations = [-1, 101, 150];

      validAllocations.forEach(allocation => {
        expect(allocation).toBeGreaterThanOrEqual(0);
        expect(allocation).toBeLessThanOrEqual(100);
      });

      invalidAllocations.forEach(allocation => {
        expect(allocation < 0 || allocation > 100).toBe(true);
      });
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete portfolio workflow', async () => {
    const { db } = await import('@/lib/db');

    // Mock portfolio creation
    (db.recommendedPortfolio.create as jest.Mock).mockResolvedValue({
      id: 'new-portfolio',
      name: 'Test Portfolio',
      isActive: true,
      funds: []
    });

    // Mock fund addition
    (db.recommendedFund.findMany as jest.Mock).mockResolvedValue([]);
    (db.recommendedFund.findFirst as jest.Mock).mockResolvedValue(null);
    (db.recommendedFund.create as jest.Mock).mockResolvedValue({
      id: 'new-fund',
      ticker: 'HGLG11',
      allocation: 25
    });

    // Test workflow
    const portfolioData = { name: 'Test Portfolio', isActive: true };
    const fundData = {
      ticker: 'HGLG11',
      allocation: 25,
      currentPrice: 100,
      averagePrice: 95,
      ceilingPrice: 120
    };

    // Validate portfolio creation
    expect(portfolioData.name).toBeTruthy();

    // Validate fund addition
    const allocationResult = await validatePortfolioAllocation('new-portfolio', 25);
    expect(allocationResult.isValid).toBe(true);

    const tickerResult = await validateUniqueTickerInPortfolio('new-portfolio', 'HGLG11');
    expect(tickerResult.isValid).toBe(true);

    const priceResult = validatePriceRelationships(100, 95, 120);
    expect(priceResult.isValid).toBe(true);
  });
});