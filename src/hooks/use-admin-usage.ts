import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface UsageHistoryItem {
  id: string;
  userId: string;
  operationType: string;
  creditsUsed: number;
  details: any;
  timestamp: string;
  user: {
    name: string | null;
    email: string | null;
  };
}

export interface UsageHistoryResponse {
  data: UsageHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UseAdminUsageParams {
  type?: string;
  range?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsage(params: UseAdminUsageParams = {}) {
  const {
    type = 'all',
    range = '7days',
    q = '',
    page = 1,
    pageSize = 25
  } = params;

  return useQuery({
    queryKey: ['admin', 'usage', { type, range, q, page, pageSize }],
    queryFn: async (): Promise<UsageHistoryResponse> => {
      const searchParams = new URLSearchParams({
        type,
        range,
        q,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      return apiClient<UsageHistoryResponse>(`/api/admin/usage?${searchParams}`);
    },
    staleTime: 30000, // 30 segundos
    gcTime: 300000, // 5 minutos
  });
}
