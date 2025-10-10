import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AporteRecomendacaoResponse } from '@/types/aporte';

interface GerarRecomendacaoParams {
  portfolioId: string;
  valorDisponivel: number;
}

export function useRecomendacaoAporte() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: GerarRecomendacaoParams): Promise<AporteRecomendacaoResponse> => {
      return api.post('/api/aporte/recomendacao', params);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['aporte-historico'] });
    },
  });
}
