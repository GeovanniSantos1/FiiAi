import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  CreatePortfolioData,
  UpdatePortfolioData,
  CreateFundData,
  UpdateFundData,
  PortfolioWithFunds,
  RecommendedFundType
} from '@/lib/validations/carteiras';

// Portfolio hooks
export function useAdminPortfolios() {
  return useQuery<PortfolioWithFunds[]>({
    queryKey: ['admin', 'portfolios'],
    queryFn: () => api.get('/api/admin/carteiras'),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000, // 10 minutes
  });
}

export function useAdminPortfolio(id: string) {
  return useQuery<PortfolioWithFunds>({
    queryKey: ['admin', 'portfolios', id],
    queryFn: () => api.get(`/api/admin/carteiras/${id}`),
    enabled: !!id,
    staleTime: 2 * 60_000, // 2 minutes
    gcTime: 5 * 60_000, // 5 minutes
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePortfolioData) =>
      api.post('/api/admin/carteiras', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
    },
    onError: (error) => {
      console.error('Error creating portfolio:', error);
    }
  });
}

export function useUpdatePortfolio(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePortfolioData) =>
      api.put(`/api/admin/carteiras/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', id] });
    },
    onError: (error) => {
      console.error('Error updating portfolio:', error);
    }
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/carteiras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
    },
    onError: (error) => {
      console.error('Error deleting portfolio:', error);
    }
  });
}

// Fund hooks
export function usePortfolioFunds(portfolioId: string) {
  return useQuery<RecommendedFundType[]>({
    queryKey: ['admin', 'portfolios', portfolioId, 'funds'],
    queryFn: () => api.get(`/api/admin/carteiras/${portfolioId}/fundos`),
    enabled: !!portfolioId,
    staleTime: 2 * 60_000, // 2 minutes
    gcTime: 5 * 60_000, // 5 minutes
  });
}

export function usePortfolioFund(portfolioId: string, fundId: string) {
  return useQuery<RecommendedFundType>({
    queryKey: ['admin', 'portfolios', portfolioId, 'funds', fundId],
    queryFn: () => api.get(`/api/admin/carteiras/${portfolioId}/fundos/${fundId}`),
    enabled: !!portfolioId && !!fundId,
    staleTime: 2 * 60_000, // 2 minutes
    gcTime: 5 * 60_000, // 5 minutes
  });
}

export function useCreateFund(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFundData) =>
      api.post(`/api/admin/carteiras/${portfolioId}/fundos`, data),
    onSuccess: () => {
      // Invalidate portfolio data to update fund count and total allocation
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId, 'funds'] });
    },
    onError: (error) => {
      console.error('Error creating fund:', error);
    }
  });
}

export function useUpdateFund(portfolioId: string, fundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFundData) =>
      api.put(`/api/admin/carteiras/${portfolioId}/fundos/${fundId}`, data),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId, 'funds'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId, 'funds', fundId] });
    },
    onError: (error) => {
      console.error('Error updating fund:', error);
    }
  });
}

export function useDeleteFund(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fundId: string) =>
      api.delete(`/api/admin/carteiras/${portfolioId}/fundos/${fundId}`),
    onSuccess: () => {
      // Invalidate portfolio data to update fund count and total allocation
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId, 'funds'] });
    },
    onError: (error) => {
      console.error('Error deleting fund:', error);
    }
  });
}

// Utility hooks for enhanced functionality
export function usePortfolioStats(portfolioId: string) {
  const { data: portfolio } = useAdminPortfolio(portfolioId);

  return {
    totalFunds: portfolio?.funds?.length || 0,
    totalAllocation: portfolio?.funds?.reduce((sum, fund) => sum + fund.allocation, 0) || 0,
    remainingAllocation: 100 - (portfolio?.funds?.reduce((sum, fund) => sum + fund.allocation, 0) || 0),
    fundsByRecommendation: portfolio?.funds?.reduce((acc, fund) => {
      acc[fund.recommendation] = (acc[fund.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    fundsBySegment: portfolio?.funds?.reduce((acc, fund) => {
      acc[fund.segment] = (acc[fund.segment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {}
  };
}

export function useAllPortfoliosStats() {
  const { data: portfolios } = useAdminPortfolios();

  return {
    totalPortfolios: portfolios?.length || 0,
    activePortfolios: portfolios?.filter(p => p.isActive)?.length || 0,
    totalFunds: portfolios?.reduce((sum, portfolio) => sum + (portfolio._count?.funds || 0), 0) || 0,
    averageFundsPerPortfolio: portfolios?.length ?
      (portfolios.reduce((sum, portfolio) => sum + (portfolio._count?.funds || 0), 0) / portfolios.length) : 0
  };
}

// Bulk operations (for future enhancement)
export function useBulkUpdateFunds(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operations: Array<{ id?: string; data: CreateFundData | UpdateFundData; operation: 'create' | 'update' | 'delete' }>) => {
      const promises = operations.map(({ id, data, operation }) => {
        switch (operation) {
          case 'create':
            return api.post(`/api/admin/carteiras/${portfolioId}/fundos`, data);
          case 'update':
            return api.put(`/api/admin/carteiras/${portfolioId}/fundos/${id}`, data);
          case 'delete':
            return api.delete(`/api/admin/carteiras/${portfolioId}/fundos/${id}`);
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'portfolios', portfolioId, 'funds'] });
    },
    onError: (error) => {
      console.error('Error in bulk fund operations:', error);
    }
  });
}