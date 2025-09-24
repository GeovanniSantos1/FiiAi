"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Target, Upload } from "lucide-react";
import Link from "next/link";

interface PortfolioSummaryData {
  hasPortfolio: boolean;
  totalValue: number;
  totalPositions: number;
  lastUpdated?: string;
  sectorDistribution: Array<{
    sector: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  topPositions: Array<{
    fiiCode: string;
    fiiName: string;
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  }>;
  recentAnalysis?: {
    overallScore: number;
    riskLevel: string;
    createdAt: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

function usePortfolioSummary() {
  return useQuery<PortfolioSummaryData>({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/portfolio-summary');
      if (!response.ok) {
        if (response.status === 404) {
          return {
            hasPortfolio: false,
            totalValue: 0,
            totalPositions: 0,
            sectorDistribution: [],
            topPositions: []
          };
        }
        throw new Error('Failed to fetch portfolio summary');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function PortfolioSummary() {
  const { data, isLoading, error } = usePortfolioSummary();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="md:col-span-2 lg:col-span-3">
        <CardContent className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Erro ao carregar dados da carteira</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.hasPortfolio) {
    return (
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Sua Carteira de FIIs
          </CardTitle>
          <CardDescription>
            Para começar, faça upload da sua carteira e obtenha análises personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Você ainda não possui uma carteira cadastrada
            </p>
            <Button asChild>
              <Link href="/dashboard/avaliar-carteira">
                Carregar Carteira
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieIcon className="h-5 w-5" />
            Resumo da Carteira
          </CardTitle>
          <CardDescription>
            Visão geral dos seus investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(data.totalValue)}</p>
              <p className="text-sm text-muted-foreground">
                {data.totalPositions} FIIs • Atualizado {new Date(data.lastUpdated || '').toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            {data.recentAnalysis && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Última Análise</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-semibold">{data.recentAnalysis.overallScore}/100</span>
                      <Badge variant={
                        data.recentAnalysis.riskLevel === 'BAIXO' ? 'default' :
                        data.recentAnalysis.riskLevel === 'MODERADO' ? 'secondary' : 'destructive'
                      }>
                        {data.recentAnalysis.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/avaliar-carteira">
                      Nova Análise
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sector Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieIcon className="h-5 w-5" />
            Distribuição por Setores
          </CardTitle>
          <CardDescription>
            Diversificação da sua carteira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sectorDistribution}
                  dataKey="value"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                >
                  {data.sectorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {data.sectorDistribution.slice(0, 3).map((sector, index) => (
              <div key={sector.sector} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{sector.sector}</span>
                </div>
                <span className="text-sm font-medium">{sector.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Principais Posições
          </CardTitle>
          <CardDescription>
            Seus maiores investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topPositions.slice(0, 5).map((position) => (
              <div key={position.fiiCode} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{position.fiiCode}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {position.fiiName}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{position.percentage.toFixed(1)}%</span>
                    {position.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {position.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(position.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4" asChild>
            <Link href="/dashboard/avaliar-carteira">
              Ver Carteira Completa
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}