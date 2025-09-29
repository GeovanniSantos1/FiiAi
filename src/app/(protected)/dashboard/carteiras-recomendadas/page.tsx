"use client";

import React from "react";
import Link from "next/link";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  Eye, 
  Calendar,
  PieChart,
  ArrowRight,
  Star,
  Target
} from "lucide-react";
import { useRecommendedPortfolios } from "@/hooks/use-recommended-portfolios";
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

export default function CarteirasRecomendadasPage() {
  const { data: portfolios, isLoading, error } = useRecommendedPortfolios();

  useSetPageMetadata({
    title: "Carteiras Recomendadas",
    description: "Explore carteiras de FIIs curadas pela nossa equipe de especialistas",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Carteiras Recomendadas" }
    ]
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
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
        <Card className="p-6">
          <div className="text-center text-destructive">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar carteiras recomendadas</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4" />
          <span>Curadoria especializada</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portfolio Cards */}
      {!isLoading && portfolios && portfolios.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => {
            const stats = getRecommendationStats(portfolio.funds);
            const totalAllocation = getTotalAllocation(portfolio.funds);
            
            return (
              <Card key={portfolio.id} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {portfolio.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {portfolio.funds.length} FII{portfolio.funds.length !== 1 ? 's' : ''}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {totalAllocation.toFixed(1)}% alocado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {portfolio.description && (
                    <CardDescription className="text-sm leading-relaxed">
                      {portfolio.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Recommendation Stats */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats).map(([rec, count]) => (
                        <Badge 
                          key={rec} 
                          variant="outline" 
                          className={`text-xs ${RECOMMENDATION_COLORS[rec as keyof typeof RECOMMENDATION_COLORS]}`}
                        >
                          {count as number} {RECOMMENDATION_LABELS[rec as keyof typeof RECOMMENDATION_LABELS]}
                        </Badge>
                      ))}
                    </div>

                    {/* Top Holdings Preview */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Principais posições:</p>
                      <div className="space-y-1">
                        {portfolio.funds.slice(0, 3).map((fund) => (
                          <div key={fund.id} className="flex items-center justify-between text-sm">
                            <span className="font-mono">{fund.ticker}</span>
                            <span className="text-muted-foreground">{fund.allocation}%</span>
                          </div>
                        ))}
                        {portfolio.funds.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{portfolio.funds.length - 3} mais...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(portfolio.updatedAt)}</span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        asChild
                      >
                        <Link href={`/dashboard/carteiras-recomendadas/${portfolio.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && portfolios && portfolios.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma carteira disponível</h3>
            <p className="text-muted-foreground mb-6">
              Ainda não há carteiras recomendadas disponíveis. Nossa equipe está trabalhando
              para trazer as melhores oportunidades em FIIs.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  Voltar ao Dashboard
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/avaliar-carteira">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Avaliar Minha Carteira
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* CTA Section */}
      {!isLoading && portfolios && portfolios.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-2">Quer uma análise personalizada?</h3>
                <p className="text-muted-foreground">
                  Use nossos agentes de IA para avaliar sua carteira atual e receber recomendações específicas
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/avaliar-carteira">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Avaliar Carteira
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard/direcionar-aportes">
                    <Target className="h-4 w-4 mr-2" />
                    Direcionar Aportes
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
