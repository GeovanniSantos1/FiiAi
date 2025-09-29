"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Building2, 
  ArrowLeft, 
  TrendingUp, 
  DollarSign,
  Target,
  PieChart,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";
import { useRecommendedPortfolio } from "@/hooks/use-recommended-portfolios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const RECOMMENDATION_COLORS = {
  BUY: "bg-green-100 text-green-800 border-green-200",
  HOLD: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  SELL: "bg-red-100 text-red-800 border-red-200"
};

const RECOMMENDATION_LABELS = {
  BUY: "Comprar",
  HOLD: "Manter",
  SELL: "Vender"
};

const RECOMMENDATION_ICONS = {
  BUY: CheckCircle,
  HOLD: AlertCircle,
  SELL: XCircle
};

export default function CarteiraRecomendadaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = params.id as string;
  
  const { data: portfolio, isLoading, error } = useRecommendedPortfolio(portfolioId);

  useSetPageMetadata({
    title: portfolio ? `${portfolio.name} - Carteira Recomendada` : "Carteira Recomendada",
    description: portfolio?.description || "Detalhes da carteira recomendada",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Carteiras Recomendadas", href: "/dashboard/carteiras-recomendadas" },
      { label: portfolio?.name || "Carregando..." }
    ]
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getRecommendationStats = (funds: any[]) => {
    const stats = funds.reduce((acc, fund) => {
      acc[fund.recommendation] = (acc[fund.recommendation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return stats;
  };

  const getTotalAllocation = (funds: any[]) => {
    return funds.reduce((total, fund) => total + fund.allocation, 0);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Card className="p-6">
          <div className="text-center text-destructive">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar carteira recomendada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        </div>
        
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        
        <Card className="p-6">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p>Carteira não encontrada</p>
          </div>
        </Card>
      </div>
    );
  }

  const stats = getRecommendationStats(portfolio.funds);
  const totalAllocation = getTotalAllocation(portfolio.funds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Portfolio Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{portfolio.name}</h1>
            {portfolio.description && (
              <p className="text-muted-foreground mt-2 text-lg">
                {portfolio.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Atualizada em {formatDate(portfolio.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total de FIIs</p>
                <p className="text-2xl font-bold">{portfolio.funds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Alocação Total</p>
                <p className="text-2xl font-bold">{totalAllocation.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Recomendações Compra</p>
                <p className="text-2xl font-bold">{stats.BUY || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Manter Posição</p>
                <p className="text-2xl font-bold">{stats.HOLD || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Composição da Carteira
          </CardTitle>
          <CardDescription>
            Detalhamento completo dos FIIs que compõem esta carteira recomendada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Nome do Fundo</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">Preço Atual</TableHead>
                  <TableHead className="text-right">Preço Médio</TableHead>
                  <TableHead className="text-right">Teto</TableHead>
                  <TableHead className="text-right">Alocação</TableHead>
                  <TableHead className="text-center">Recomendação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.funds
                  .sort((a, b) => b.allocation - a.allocation)
                  .map((fund) => {
                    const RecommendationIcon = RECOMMENDATION_ICONS[fund.recommendation as keyof typeof RECOMMENDATION_ICONS];
                    
                    return (
                      <TableRow key={fund.id}>
                        <TableCell className="font-mono font-medium">
                          {fund.ticker}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{fund.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {fund.segment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(fund.currentPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(fund.averagePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(fund.ceilingPrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {fund.allocation}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${RECOMMENDATION_COLORS[fund.recommendation as keyof typeof RECOMMENDATION_COLORS]}`}
                          >
                            <RecommendationIcon className="h-3 w-3 mr-1" />
                            {RECOMMENDATION_LABELS[fund.recommendation as keyof typeof RECOMMENDATION_LABELS]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-2">Gostou desta carteira?</h3>
              <p className="text-muted-foreground">
                Use nossos agentes de IA para analisar como ela se compara com sua carteira atual
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/avaliar-carteira">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Comparar com Minha Carteira
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/direcionar-aportes">
                  <Target className="h-4 w-4 mr-2" />
                  Simular Aportes
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
