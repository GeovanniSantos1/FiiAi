import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface FIIAnalysisResult {
  overallScore: number;
  riskLevel: 'BAIXO' | 'MODERADO' | 'ALTO';
  diversificationScore: number;
  concentrationRisk: number;
  sectorAnalysis: {
    distribution: Record<string, number>;
    recommendations: string[];
  };
  performanceAnalysis: {
    totalValue: number;
    strongPositions: string[];
    weakPositions: string[];
  };
  recommendations: string[];
  summary: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis: FIIAnalysisResult;
  reportId: string;
  createdAt?: string;
}

export function usePortfolioAnalysis(portfolioId?: string) {
  const queryClient = useQueryClient();

  // Mutation to create new analysis
  const analyzePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: string): Promise<AnalysisResponse> => {
      const response = await fetch('/api/portfolio/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze portfolio');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Análise da carteira concluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['portfolio-analysis'] });
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      toast.error(`Erro na análise: ${error.message}`);
    },
  });

  // Query to get existing analysis
  const analysisQuery = useQuery({
    queryKey: ['portfolio-analysis', portfolioId],
    queryFn: async (): Promise<AnalysisResponse> => {
      if (!portfolioId) throw new Error('Portfolio ID required');
      
      const response = await fetch(`/api/portfolio/analysis?portfolioId=${portfolioId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis');
      }

      return response.json();
    },
    enabled: !!portfolioId,
    retry: false,
  });

  return {
    // Analysis data
    analysis: analysisQuery.data?.analysis,
    reportId: analysisQuery.data?.reportId,
    createdAt: analysisQuery.data?.createdAt,
    
    // Loading states
    isAnalyzing: analyzePortfolioMutation.isPending,
    isLoadingAnalysis: analysisQuery.isPending,
    
    // Error states
    analysisError: analysisQuery.error?.message,
    
    // Actions
    analyzePortfolio: (portfolioId: string) => analyzePortfolioMutation.mutate(portfolioId),
    
    // Computed states
    hasAnalysis: !!analysisQuery.data?.analysis,
    canAnalyze: !analyzePortfolioMutation.isPending,
  };
}

export function usePortfolioAnalysisList(userId?: string) {
  return useQuery({
    queryKey: ['portfolio-analyses', userId],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/analysis/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis list');
      }

      return response.json();
    },
    enabled: !!userId,
  });
}