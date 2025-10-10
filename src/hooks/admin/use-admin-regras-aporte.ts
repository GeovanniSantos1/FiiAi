import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { UpdateRegrasAporteRequest } from '@/types/aporte';
import { toast } from 'sonner';

interface RegrasAporte {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  descontoMinimoAceitavel: number;
  permitirSemDesconto: boolean;
  toleranciaDesbalanceamento: number;
  pesoDesbalanceamento: number;
  pesoDesconto: number;
  limiteMaximoFundos: number;
  alocacaoSequencial: boolean;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export function useAdminRegrasAporte() {
  const queryClient = useQueryClient();

  // Query para buscar regras
  const query = useQuery<RegrasAporte>({
    queryKey: ['admin', 'regras-aporte'],
    queryFn: () => api.get('/api/admin/regras-aporte'),
    staleTime: 5 * 60_000, // 5 minutos
  });

  // Mutation para atualizar regras
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateRegrasAporteRequest): Promise<RegrasAporte> => {
      return api.put('/api/admin/regras-aporte', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regras-aporte'] });
      toast.success('Regras atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar regras');
    },
  });

  return {
    regras: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateRegras: updateMutation,
  };
}
