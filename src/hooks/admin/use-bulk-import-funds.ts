/**
 * Hooks para validação e importação em massa de fundos
 * Plan-008: Upload em Lote de Fundos para Carteiras Recomendadas
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  FundImportResult,
  FundImportRow,
  FundImportValidationResult
} from '@/types/fund-import';

/**
 * Hook para validar fundos no servidor antes de importar
 */
export function useValidateBulkFunds(portfolioId: string) {
  return useMutation({
    mutationFn: async (funds: FundImportRow[]) => {
      return api.post<FundImportValidationResult>(
        `/api/admin/carteiras/${portfolioId}/fundos/validate-bulk`,
        { funds }
      );
    }
  });
}

/**
 * Hook para importar fundos em massa
 */
export function useBulkImportFunds(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      funds,
      mode = 'merge'
    }: {
      funds: FundImportRow[];
      mode?: 'merge' | 'replace';
    }) => {
      return api.post<FundImportResult>(
        `/api/admin/carteiras/${portfolioId}/fundos/bulk-import`,
        { funds, mode }
      );
    },
    onSuccess: () => {
      // Invalidar cache de fundos
      queryClient.invalidateQueries({
        queryKey: ['admin', 'portfolios', portfolioId, 'funds']
      });
      queryClient.invalidateQueries({
        queryKey: ['admin', 'portfolios', portfolioId]
      });
    }
  });
}
