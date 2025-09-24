"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FiiSector } from "@prisma/client";

export type RecommendedPortfolio = {
  id: string;
  fiiCode: string;
  fiiName: string;
  sector: FiiSector;
  percentage: number;
  reasoning?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePortfolioData = {
  fiiCode: string;
  fiiName: string;
  sector: FiiSector;
  percentage: number;
  reasoning?: string;
  isActive?: boolean;
};

export type UpdatePortfolioData = Partial<CreatePortfolioData>;

export function useAdminRecommendedPortfolio(
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  sector?: string,
  isActive?: string
) {
  const [data, setData] = useState<{
    portfolios: RecommendedPortfolio[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
    totalPercentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(sector && { sector }),
        ...(isActive && { isActive }),
      });

      const response = await fetch(`/api/admin/recommended-portfolio?${params}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch recommended portfolio:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Falha ao carregar carteira recomendada");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, search, sector, isActive]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useCreateRecommendedPortfolio() {
  const [loading, setLoading] = useState(false);

  const createPortfolio = async (data: CreatePortfolioData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/recommended-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }

      toast.success("FII adicionado à carteira recomendada com sucesso!");
      return true;
    } catch (err) {
      console.error("Failed to create portfolio entry:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Falha ao adicionar FII: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPortfolio,
    loading,
  };
}

export function useUpdateRecommendedPortfolio() {
  const [loading, setLoading] = useState(false);

  const updatePortfolio = async (id: string, data: UpdatePortfolioData): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/recommended-portfolio/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }

      toast.success("FII atualizado com sucesso!");
      return true;
    } catch (err) {
      console.error("Failed to update portfolio entry:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Falha ao atualizar FII: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updatePortfolio,
    loading,
  };
}

export function useDeleteRecommendedPortfolio() {
  const [loading, setLoading] = useState(false);

  const deletePortfolio = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/recommended-portfolio/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }

      toast.success("FII removido da carteira recomendada com sucesso!");
      return true;
    } catch (err) {
      console.error("Failed to delete portfolio entry:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Falha ao remover FII: ${message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deletePortfolio,
    loading,
  };
}