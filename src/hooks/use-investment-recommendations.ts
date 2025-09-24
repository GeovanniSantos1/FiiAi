import { useMutation } from '@tanstack/react-query';

interface InvestmentRequest {
  investmentAmount: number;
  preferences?: string;
  riskTolerance?: 'CONSERVADOR' | 'MODERADO' | 'ARROJADO';
  investmentGoal?: 'RENDA' | 'CRESCIMENTO' | 'BALANCEADO';
}

interface InvestmentRecommendation {
  fiiCode: string;
  suggestedAmount: number;
  reason: string;
  priority: 'ALTA' | 'MÉDIA' | 'BAIXA';
}

interface InvestmentResponse {
  success: boolean;
  investmentAmount: number;
  recommendations: InvestmentRecommendation[];
  strategy: string;
  expectedYield: number;
  consultationId: string;
  hasExistingPortfolio: boolean;
}

export function useInvestmentRecommendations() {
  return useMutation({
    mutationFn: async (data: InvestmentRequest): Promise<InvestmentResponse> => {
      const response = await fetch('/api/investment/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }

      return response.json();
    },
  });
}