"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface PortfolioPosition {
  fiiCode: string;
  fiiName?: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  currentValue: number;
  sector?: string;
  percentage?: number;
}

export interface UploadResult {
  id: string;
  totalValue: number;
  positionsCount: number;
  skippedRows: number;
  positions: PortfolioPosition[];
}

export interface UploadResponse {
  success: boolean;
  portfolio?: UploadResult;
  message?: string;
  error?: string;
  details?: string;
  foundHeaders?: string[];
  requiredColumns?: string[];
}

export function usePortfolioUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadPortfolio = async (file: File): Promise<UploadResult | null> => {
    if (!file) {
      throw new Error("Nenhum arquivo selecionado");
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/portfolio/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (data.foundHeaders && data.requiredColumns) {
          const errorMsg = `${data.error}\n\nColunas encontradas: ${data.foundHeaders.join(', ')}\nColunas obrigatórias: ${data.requiredColumns.join(', ')}`;
          throw new Error(errorMsg);
        }
        throw new Error(data.error || `Erro HTTP ${response.status}`);
      }

      if (!data.success || !data.portfolio) {
        throw new Error(data.error || "Erro desconhecido no upload");
      }

      setUploadResult(data.portfolio);
      
      // Show success message with details
      const message = data.message || `Portfolio carregado: ${data.portfolio.positionsCount} posições, valor total R$ ${data.portfolio.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      toast.success(message);

      return data.portfolio;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido durante o upload';
      setError(errorMessage);
      toast.error(`Erro no upload: ${errorMessage}`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const clearResult = () => {
    setUploadResult(null);
    setError(null);
  };

  return {
    uploading,
    uploadResult,
    error,
    uploadPortfolio,
    clearResult,
  };
}