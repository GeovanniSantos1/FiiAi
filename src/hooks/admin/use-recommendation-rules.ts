import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export function useRecommendationRules() {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules'],
    queryFn: () => api.get('/api/admin/recommendation-rules'),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

export function useActiveRecommendationRules() {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules', 'active'],
    queryFn: () => api.get('/api/admin/recommendation-rules/active'),
    staleTime: 10 * 60_000, // 10 minutes
    retry: 1, // Don't retry too much if no active ruleset
  });
}

export function useRecommendationRuleById(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules', id],
    queryFn: () => api.get(`/api/admin/recommendation-rules/${id}`),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function useCreateRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      api.post('/api/admin/recommendation-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Regras criadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar regras');
    },
  });
}

export function useUpdateRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/admin/recommendation-rules/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules', variables.id] });
      toast.success('Regras atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar regras');
    },
  });
}

export function useDeleteRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/admin/recommendation-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Regras excluídas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir regras');
    },
  });
}

export function useActivateRecommendationRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/recommendation-rules/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules', 'active'] });
      toast.success('Regras ativadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao ativar regras');
    },
  });
}

export function useUploadRecommendationRulesExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);

      return fetch('/api/admin/recommendation-rules/upload-excel', {
        method: 'POST',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.details || error.error || 'Failed to upload');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      toast.success('Excel processado e regras criadas!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao processar Excel');
    },
  });
}

export function useRuleSetVersionHistory(ruleSetId: string | null) {
  return useQuery({
    queryKey: ['admin', 'recommendation-rules', ruleSetId, 'versions'],
    queryFn: () => api.get(`/api/admin/recommendation-rules/${ruleSetId}/versions`),
    enabled: !!ruleSetId,
    staleTime: 10 * 60_000,
  });
}

export function useRollbackRuleSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleSetId, version }: { ruleSetId: string; version: number }) =>
      api.post(`/api/admin/recommendation-rules/${ruleSetId}/rollback`, { version }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules', variables.ruleSetId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recommendation-rules', variables.ruleSetId, 'versions'] });
      toast.success('Rollback realizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao fazer rollback');
    },
  });
}