import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface RecommendedFund {
  id: string;
  ticker: string;
  name: string;
  segment: string;
  currentPrice: number;
  averagePrice: number;
  ceilingPrice: number;
  allocation: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  createdAt: string;
  updatedAt: string;
}

export interface RecommendedPortfolio {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  funds: RecommendedFund[];
  _count: {
    funds: number;
  };
}

export function useRecommendedPortfolios() {
  return useQuery({
    queryKey: ['recommended-portfolios'],
    queryFn: async (): Promise<RecommendedPortfolio[]> => {
      // Usar a API pública de carteiras recomendadas (já filtra apenas ativas)
      return apiClient<RecommendedPortfolio[]>('/api/carteiras-recomendadas');
    },
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
  });
}

export function useRecommendedPortfolio(id: string) {
  return useQuery({
    queryKey: ['recommended-portfolio', id],
    queryFn: async (): Promise<RecommendedPortfolio> => {
      return apiClient<RecommendedPortfolio>(`/api/carteiras-recomendadas/${id}`);
    },
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos
    enabled: !!id,
  });
}
