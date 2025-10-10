"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export type FundoPrecoTeto = {
  id: string;
  ticker: string;
  name: string;
  segment: string;
  currentPrice: number;
  ceilingPrice: number | null;
  portfolioId: string;
  portfolioName: string;
  desconto: number | null; // Percentual de desconto calculado
};

export type UpdatePrecoTetoData = {
  fundoId: string;
  ceilingPrice: number;
};

export type BulkUpdatePrecoTetoData = {
  updates: UpdatePrecoTetoData[];
};

/**
 * Hook para listar todos os fundos com seus preços teto
 */
export function useFundosPrecoTeto() {
  return useQuery<FundoPrecoTeto[]>({
    queryKey: ["admin", "precos-teto"],
    queryFn: () => api.get("/api/admin/precos-teto"),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Hook para atualizar preço teto de um fundo individual
 */
export function useUpdatePrecoTeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdatePrecoTetoData) =>
      api.patch(`/api/admin/precos-teto/${data.fundoId}`, {
        ceilingPrice: data.ceilingPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "precos-teto"] });
      toast({
        title: "Preço teto atualizado",
        description: "O preço teto foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para atualizar preços teto em massa
 */
export function useBulkUpdatePrecoTeto() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BulkUpdatePrecoTetoData) =>
      api.post("/api/admin/precos-teto/bulk", data),
    onSuccess: (data: { updated: number }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "precos-teto"] });
      toast({
        title: "Preços atualizados",
        description: `${data.updated} preço(s) teto foram atualizados com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
