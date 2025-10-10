import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { BulkImportResult, UserImportRow, ImportValidationResult } from '@/types/bulk-import';

export function useValidateBulkUsers() {
  return useMutation({
    mutationFn: async (users: UserImportRow[]) => {
      return api.post<ImportValidationResult>('/api/admin/users/validate-bulk', { users });
    },
  });
}

export function useBulkImportUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (users: UserImportRow[]) => {
      return api.post<BulkImportResult>('/api/admin/users/bulk-import', { users });
    },
    onSuccess: () => {
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
