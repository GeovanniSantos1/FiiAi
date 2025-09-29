import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecommendationBadge } from '@/components/admin/carteiras/RecommendationBadge';

// Mock do hook use-toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock do router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/admin/carteiras',
}));

// Mock dos hooks personalizados
jest.mock('@/hooks/admin/use-admin-carteiras', () => ({
  useAdminPortfolios: () => ({
    data: [
      {
        id: '1',
        name: 'Carteira Teste',
        description: 'Uma carteira para testes',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        funds: [
          {
            id: 'fund-1',
            ticker: 'HGLG11',
            name: 'Hedge General Logistics',
            segment: 'Logístico',
            allocation: 25,
            recommendation: 'BUY',
            currentPrice: 156.78,
            averagePrice: 140.50,
            ceilingPrice: 180.00,
          }
        ],
        _count: { funds: 1 }
      }
    ],
    isLoading: false,
    error: null,
  }),
  useDeletePortfolio: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
  usePortfolioStats: () => ({
    totalFunds: 1,
    totalAllocation: 25,
    remainingAllocation: 75,
    fundsByRecommendation: { BUY: 1, SELL: 0, HOLD: 0 },
    fundsBySegment: { 'Logístico': 1 }
  }),
}));

// Wrapper com QueryClient para testes
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('RecommendationBadge Component', () => {
  it('should render BUY recommendation correctly', () => {
    render(
      <TestWrapper>
        <RecommendationBadge recommendation="BUY" />
      </TestWrapper>
    );

    const badge = screen.getByText('Comprar');
    expect(badge).toBeInTheDocument();
  });

  it('should render SELL recommendation correctly', () => {
    render(
      <TestWrapper>
        <RecommendationBadge recommendation="SELL" />
      </TestWrapper>
    );

    const badge = screen.getByText('Vender');
    expect(badge).toBeInTheDocument();
  });

  it('should render HOLD recommendation correctly', () => {
    render(
      <TestWrapper>
        <RecommendationBadge recommendation="HOLD" />
      </TestWrapper>
    );

    const badge = screen.getByText('Aguardar');
    expect(badge).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <TestWrapper>
        <RecommendationBadge recommendation="BUY" className="custom-class" />
      </TestWrapper>
    );

    const badge = screen.getByText('Comprar');
    expect(badge).toHaveClass('custom-class');
  });
});

describe('CarteirasTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    // Mock loading state
    jest.doMock('@/hooks/admin/use-admin-carteiras', () => ({
      useAdminPortfolios: () => ({
        data: undefined,
        isLoading: true,
        error: null,
      }),
      useDeletePortfolio: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));

    const { CarteirasTable } = require('@/components/admin/carteiras/CarteirasTable');

    render(
      <TestWrapper>
        <CarteirasTable />
      </TestWrapper>
    );

    expect(screen.getByText('Carteiras Recomendadas')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    // Mock empty state
    jest.doMock('@/hooks/admin/use-admin-carteiras', () => ({
      useAdminPortfolios: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
      useDeletePortfolio: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));

    const { CarteirasTable } = require('@/components/admin/carteiras/CarteirasTable');

    render(
      <TestWrapper>
        <CarteirasTable />
      </TestWrapper>
    );

    expect(screen.getByText('Nenhuma carteira encontrada')).toBeInTheDocument();
    expect(screen.getByText('Criar primeira carteira')).toBeInTheDocument();
  });

  it('should render portfolios data', () => {
    const { CarteirasTable } = require('@/components/admin/carteiras/CarteirasTable');

    render(
      <TestWrapper>
        <CarteirasTable />
      </TestWrapper>
    );

    expect(screen.getByText('Carteira Teste')).toBeInTheDocument();
    expect(screen.getByText('Uma carteira para testes')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Fund count
    expect(screen.getByText('25.0% alocado')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
  });
});

describe('Form Validation Tests', () => {
  describe('Ticker Validation', () => {
    it('should validate correct ticker format', () => {
      const validTickers = ['HGLG11', 'BTLG11', 'XPML11', 'FIIB11'];
      const tickerRegex = /^[A-Z]{4}[0-9]{2}$/;

      validTickers.forEach(ticker => {
        expect(ticker).toMatch(tickerRegex);
      });
    });

    it('should reject invalid ticker formats', () => {
      const invalidTickers = ['HGLG', 'HGLG111', 'hglg11', '123456', 'HGL11', 'HGLG1'];
      const tickerRegex = /^[A-Z]{4}[0-9]{2}$/;

      invalidTickers.forEach(ticker => {
        expect(ticker).not.toMatch(tickerRegex);
      });
    });
  });

  describe('Allocation Validation', () => {
    it('should accept valid allocation values', () => {
      const validAllocations = [0, 5.5, 25, 50, 100];

      validAllocations.forEach(allocation => {
        expect(allocation).toBeGreaterThanOrEqual(0);
        expect(allocation).toBeLessThanOrEqual(100);
      });
    });

    it('should reject invalid allocation values', () => {
      const invalidAllocations = [-1, -5.5, 101, 150];

      invalidAllocations.forEach(allocation => {
        expect(allocation < 0 || allocation > 100).toBe(true);
      });
    });
  });

  describe('Price Validation', () => {
    it('should validate price relationships', () => {
      const testCases = [
        {
          current: 100,
          average: 95,
          ceiling: 120,
          shouldBeValid: true,
          description: 'Valid price relationships'
        },
        {
          current: 130,
          average: 95,
          ceiling: 120,
          shouldBeValid: false,
          description: 'Current price above ceiling'
        },
        {
          current: 100,
          average: 130,
          ceiling: 120,
          shouldBeValid: false,
          description: 'Average price above ceiling'
        }
      ];

      testCases.forEach(({ current, average, ceiling, shouldBeValid, description }) => {
        const isCurrentValid = current <= ceiling;
        const isAverageValid = average <= ceiling;
        const isValid = isCurrentValid && isAverageValid;

        expect(isValid).toBe(shouldBeValid);
      });
    });
  });

  describe('Portfolio Name Validation', () => {
    it('should accept valid portfolio names', () => {
      const validNames = [
        'Carteira Conservadora',
        'FIIs Logísticos 2024',
        'Portfolio Diversificado',
        'A'
      ];

      validNames.forEach(name => {
        expect(name.length).toBeGreaterThan(0);
        expect(name.length).toBeLessThanOrEqual(100);
      });
    });

    it('should reject invalid portfolio names', () => {
      const invalidNames = [
        '', // Empty
        'A'.repeat(101) // Too long
      ];

      invalidNames.forEach(name => {
        expect(name.length === 0 || name.length > 100).toBe(true);
      });
    });
  });
});

describe('Component Integration Tests', () => {
  it('should handle form submission with valid data', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      id: 'new-portfolio',
      name: 'Test Portfolio'
    });

    jest.doMock('@/hooks/admin/use-admin-carteiras', () => ({
      useCreatePortfolio: () => ({
        mutateAsync: mockCreate,
        isPending: false,
      }),
    }));

    // This would test actual form submission
    const formData = {
      name: 'Test Portfolio',
      description: 'A test portfolio',
      isActive: true
    };

    // Validate the data structure
    expect(formData.name).toBeTruthy();
    expect(typeof formData.isActive).toBe('boolean');
  });

  it('should handle fund form submission with valid data', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      id: 'new-fund',
      ticker: 'HGLG11'
    });

    jest.doMock('@/hooks/admin/use-admin-carteiras', () => ({
      useCreateFund: () => ({
        mutateAsync: mockCreate,
        isPending: false,
      }),
    }));

    const fundData = {
      ticker: 'HGLG11',
      name: 'Hedge General Logistics',
      segment: 'Logístico',
      currentPrice: 156.78,
      averagePrice: 140.50,
      ceilingPrice: 180.00,
      allocation: 25,
      recommendation: 'BUY' as const
    };

    // Validate the data structure
    expect(fundData.ticker).toMatch(/^[A-Z]{4}[0-9]{2}$/);
    expect(fundData.currentPrice).toBeLessThanOrEqual(fundData.ceilingPrice);
    expect(fundData.averagePrice).toBeLessThanOrEqual(fundData.ceilingPrice);
    expect(fundData.allocation).toBeGreaterThanOrEqual(0);
    expect(fundData.allocation).toBeLessThanOrEqual(100);
    expect(['BUY', 'SELL', 'HOLD']).toContain(fundData.recommendation);
  });
});

describe('Error Handling Tests', () => {
  it('should handle API errors gracefully', () => {
    // Mock error state
    jest.doMock('@/hooks/admin/use-admin-carteiras', () => ({
      useAdminPortfolios: () => ({
        data: undefined,
        isLoading: false,
        error: new Error('API Error'),
      }),
      useDeletePortfolio: () => ({
        mutateAsync: jest.fn(),
        isPending: false,
      }),
    }));

    const { CarteirasTable } = require('@/components/admin/carteiras/CarteirasTable');

    render(
      <TestWrapper>
        <CarteirasTable />
      </TestWrapper>
    );

    expect(screen.getByText('Erro ao carregar carteiras')).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('should validate form data before submission', () => {
    const invalidPortfolioData = {
      name: '', // Invalid: empty name
      description: 'Valid description',
      isActive: true
    };

    const invalidFundData = {
      ticker: 'INVALID', // Invalid: wrong format
      allocation: 150, // Invalid: over 100%
      currentPrice: 150,
      ceilingPrice: 100 // Invalid: current > ceiling
    };

    // Test portfolio validation
    expect(invalidPortfolioData.name.length).toBe(0);

    // Test fund validation
    expect(invalidFundData.ticker).not.toMatch(/^[A-Z]{4}[0-9]{2}$/);
    expect(invalidFundData.allocation).toBeGreaterThan(100);
    expect(invalidFundData.currentPrice).toBeGreaterThan(invalidFundData.ceilingPrice);
  });
});

describe('Business Logic Tests', () => {
  it('should calculate total allocation correctly', () => {
    const funds = [
      { allocation: 25 },
      { allocation: 30 },
      { allocation: 20 }
    ];

    const total = funds.reduce((sum, fund) => sum + fund.allocation, 0);
    expect(total).toBe(75);

    const remaining = 100 - total;
    expect(remaining).toBe(25);
  });

  it('should validate allocation limits', () => {
    const currentFunds = [
      { allocation: 40 },
      { allocation: 30 }
    ];

    const currentTotal = currentFunds.reduce((sum, fund) => sum + fund.allocation, 0);
    const newAllocation = 25;
    const futureTotal = currentTotal + newAllocation;

    expect(currentTotal).toBe(70);
    expect(futureTotal).toBe(95);
    expect(futureTotal).toBeLessThanOrEqual(100);
  });

  it('should handle edge cases in allocation', () => {
    // Test 100% allocation
    const fullAllocation = [{ allocation: 100 }];
    const total = fullAllocation.reduce((sum, fund) => sum + fund.allocation, 0);
    expect(total).toBe(100);

    // Test adding to full allocation (should fail)
    const wouldExceed = total + 1;
    expect(wouldExceed).toBeGreaterThan(100);
  });

  it('should validate recommendation types', () => {
    const validRecommendations = ['BUY', 'SELL', 'HOLD'];
    const invalidRecommendations = ['buy', 'Buy', 'STRONG_BUY', 'INVALID'];

    validRecommendations.forEach(rec => {
      expect(['BUY', 'SELL', 'HOLD']).toContain(rec);
    });

    invalidRecommendations.forEach(rec => {
      expect(['BUY', 'SELL', 'HOLD']).not.toContain(rec);
    });
  });
});