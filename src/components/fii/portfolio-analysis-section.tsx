'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { usePortfolioAnalysis, type FIIAnalysisResult } from '@/hooks/use-portfolio-analysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Brain, Target, PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PortfolioAnalysisSectionProps {
  portfolioId: string;
  portfolioName?: string;
}

const COLORS = ['#D4AF37', '#B8860B', '#DAA520', '#FFD700', '#F4E87C', '#FFF8DC'];

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'BAIXO': return 'bg-green-100 text-green-800';
    case 'MODERADO': return 'bg-yellow-100 text-yellow-800';
    case 'ALTO': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export function PortfolioAnalysisSection({ portfolioId, portfolioName }: PortfolioAnalysisSectionProps) {
  const {
    analysis,
    isAnalyzing,
    isLoadingAnalysis,
    analysisError,
    analysisNotFound,
    mutationError,
    analyzePortfolio,
    hasAnalysis,
    canAnalyze,
    createdAt
  } = usePortfolioAnalysis(portfolioId);

  const handleAnalyze = () => {
    analyzePortfolio(portfolioId);
  };

  // Auto-start analysis if no analysis exists and we can analyze
  // Ignore 404 errors (analysis not found) as they're expected for new portfolios
  useEffect(() => {
    if (!isLoadingAnalysis && !hasAnalysis && canAnalyze && !isAnalyzing) {
      // Only prevent auto-start if there's a real error (not "analysis not found")
      if (!analysisError || analysisNotFound) {
        analyzePortfolio(portfolioId);
      }
    }
  }, [isLoadingAnalysis, hasAnalysis, analysisError, analysisNotFound, canAnalyze, isAnalyzing, portfolioId, analyzePortfolio]);

  // Show loading state while checking for existing analysis or while analyzing
  if (isLoadingAnalysis || isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise Inteligente
          </CardTitle>
          <CardDescription>
            {isAnalyzing ? 'Analisando sua carteira...' : 'Carregando análise da carteira...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground text-center">
              {isAnalyzing 
                ? 'Aguarde enquanto nossa IA analisa sua carteira de FIIs...' 
                : 'Carregando dados...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state only if there's a real error (not "analysis not found") and we couldn't start analysis automatically
  if (analysisError && !analysisNotFound && !hasAnalysis && !isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise Inteligente
          </CardTitle>
          <CardDescription>
            Erro ao processar análise da carteira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro na Análise</h3>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao analisar sua carteira. Tente novamente.
            </p>
            <Button 
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state for mutation errors (actual analysis failures)
  if (mutationError && !isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise Inteligente
          </CardTitle>
          <CardDescription>
            Erro ao analisar carteira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Falha na Análise</h3>
            <p className="text-muted-foreground mb-4">
              {mutationError || 'Ocorreu um erro ao analisar sua carteira. Tente novamente.'}
            </p>
            <Button 
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no analysis exists and we're not loading/analyzing, this shouldn't happen 
  // due to the useEffect auto-start, but keep as fallback
  if (!analysis && !isAnalyzing && !isLoadingAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise Inteligente
          </CardTitle>
          <CardDescription>
            Iniciando análise da sua carteira...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground text-center">
              Preparando análise da carteira...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare sector data for charts
  const sectorData = Object.entries(analysis.sectorAnalysis.distribution).map(([sector, percentage]) => ({
    sector,
    percentage: Number(percentage.toFixed(1))
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Análise Inteligente
              </CardTitle>
              <CardDescription>
                {portfolioName && `${portfolioName} • `}
                {createdAt && `Análise de ${new Date(createdAt).toLocaleDateString('pt-BR')}`}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Analisando...
                </>
              ) : (
                'Nova Análise'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">Nota Geral</div>
              <Progress value={analysis.overallScore} className="mt-2" />
            </div>

            {/* Risk Level */}
            <div className="text-center">
              <Badge className={getRiskColor(analysis.riskLevel)}>
                {analysis.riskLevel}
              </Badge>
              <div className="text-sm text-muted-foreground mt-2">Nível de Risco</div>
            </div>

            {/* Diversification */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreColor(analysis.diversificationScore)}`}>
                {analysis.diversificationScore}
              </div>
              <div className="text-sm text-muted-foreground">Diversificação</div>
              <Progress value={analysis.diversificationScore} className="mt-2" />
            </div>

            {/* Concentration Risk */}
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analysis.concentrationRisk}%
              </div>
              <div className="text-sm text-muted-foreground">Concentração</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Sector Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Distribuição por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ sector, percentage }) => `${sector}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Valor Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(analysis.performanceAnalysis.totalValue)}
                </span>
              </div>
            </div>

            <Separator />

            {analysis.performanceAnalysis.strongPositions?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">Posições Fortes</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.performanceAnalysis.strongPositions.map((fii) => (
                    <Badge key={fii} variant="secondary" className="bg-green-100 text-green-800">
                      {fii}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.performanceAnalysis.weakPositions?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2">Posições a Melhorar</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.performanceAnalysis.weakPositions.map((fii) => (
                    <Badge key={fii} variant="secondary" className="bg-orange-100 text-orange-800">
                      {fii}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>

          {analysis.sectorAnalysis.recommendations?.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-medium mb-3">Recomendações Setoriais</h4>
                <div className="space-y-2">
                  {analysis.sectorAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}