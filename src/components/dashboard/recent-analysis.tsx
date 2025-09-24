"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

interface RecentAnalysisData {
  hasAnalysis: boolean;
  analyses: Array<{
    id: string;
    type: 'PORTFOLIO_EVALUATION' | 'INVESTMENT_RECOMMENDATION';
    createdAt: string;
    summary: string;
    score?: number;
    riskLevel?: string;
    portfolioName?: string;
  }>;
}

const ANALYSIS_TYPES = {
  PORTFOLIO_EVALUATION: {
    label: 'Avaliação de Carteira',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800'
  },
  INVESTMENT_RECOMMENDATION: {
    label: 'Recomendação de Aportes',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800'
  }
};

const RISK_COLORS = {
  'BAIXO': 'bg-green-100 text-green-800',
  'MODERADO': 'bg-yellow-100 text-yellow-800', 
  'ALTO': 'bg-red-100 text-red-800'
};

function useRecentAnalysis() {
  return useQuery<RecentAnalysisData>({
    queryKey: ['recent-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/recent-analysis');
      if (!response.ok) {
        if (response.status === 404) {
          return {
            hasAnalysis: false,
            analyses: []
          };
        }
        throw new Error('Failed to fetch recent analysis');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function RecentAnalysis() {
  const { data, isLoading, error } = useRecentAnalysis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Erro ao carregar análises</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasAnalysis || data.analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análises Recentes
          </CardTitle>
          <CardDescription>
            Histórico das suas análises com IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma análise realizada ainda
            </p>
            <Button asChild>
              <Link href="/dashboard/avaliar-carteira">
                Fazer Primeira Análise
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Análises Recentes
        </CardTitle>
        <CardDescription>
          Últimas {data.analyses.length} análises realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.analyses.map((analysis) => {
            const typeInfo = ANALYSIS_TYPES[analysis.type];
            
            return (
              <div key={analysis.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={typeInfo.color}>
                      <span className="mr-1">{typeInfo.icon}</span>
                      {typeInfo.label}
                    </Badge>
                    {analysis.score && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-sm font-medium">{analysis.score}/100</span>
                      </div>
                    )}
                    {analysis.riskLevel && (
                      <Badge variant="outline" className={RISK_COLORS[analysis.riskLevel as keyof typeof RISK_COLORS]}>
                        {analysis.riskLevel}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {analysis.summary}
                </p>
                
                {analysis.portfolioName && (
                  <p className="text-xs text-muted-foreground">
                    Carteira: {analysis.portfolioName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/avaliar-carteira">
                Nova Avaliação
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/direcionar-aportes">
                Novos Aportes
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}