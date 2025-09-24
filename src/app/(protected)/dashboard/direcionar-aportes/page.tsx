"use client";

import React, { useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvestmentRecommendations } from "@/hooks/use-investment-recommendations";
import { Target, DollarSign, TrendingUp, PieChart, Calculator, Brain, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DirecionarAportesPage() {
  const [aporteValue, setAporteValue] = useState("");
  const [preferences, setPreferences] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<'CONSERVADOR' | 'MODERADO' | 'ARROJADO'>('MODERADO');
  const [investmentGoal, setInvestmentGoal] = useState<'RENDA' | 'CRESCIMENTO' | 'BALANCEADO'>('BALANCEADO');
  const [analysis, setAnalysis] = useState<any>(null);
  
  const investmentMutation = useInvestmentRecommendations();

  useSetPageMetadata({
    title: "Direcionador de Aportes FII",
    description: "Receba recomendações inteligentes para seus próximos aportes",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Direcionador de Aportes" }
    ]
  });

  const handleAnalyze = async () => {
    if (!aporteValue) {
      toast.error('Digite o valor do aporte');
      return;
    }
    
    const investmentAmount = parseFloat(aporteValue.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (investmentAmount <= 0) {
      toast.error('O valor do aporte deve ser maior que zero');
      return;
    }
    
    try {
      const result = await investmentMutation.mutateAsync({
        investmentAmount,
        preferences,
        riskTolerance,
        investmentGoal
      });
      
      setAnalysis({
        totalAporte: result.investmentAmount,
        recommendations: result.recommendations.map(rec => ({
          codigo: rec.fiiCode,
          nome: rec.fiiCode, // We'll improve this with a FII name lookup
          valor: rec.suggestedAmount,
          percentual: (rec.suggestedAmount / result.investmentAmount) * 100,
          setor: 'N/A', // Can be improved with sector mapping
          justificativa: rec.reason,
          priority: rec.priority
        })),
        reasoning: result.strategy,
        expectedYield: result.expectedYield,
        hasExistingPortfolio: result.hasExistingPortfolio
      });
      
      toast.success('Recomendações geradas com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar recomendações');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Direcionador de Aportes FII</CardTitle>
              <CardDescription className="text-base">
                Receba sugestões inteligentes de como distribuir seus novos aportes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Cálculo Automático</p>
                <p className="text-sm text-muted-foreground">Distribuição otimizada</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <PieChart className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Diversificação</p>
                <p className="text-sm text-muted-foreground">Por setores</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Yields e Liquidez</p>
                <p className="text-sm text-muted-foreground">Considerados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <Brain className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">IA OpenAI</p>
                <p className="text-sm text-muted-foreground">GPT-5</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Configurar Aporte
          </CardTitle>
          <CardDescription>
            Informe o valor que deseja aportar e suas preferências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="aporte-value">Valor do Aporte</Label>
              <Input
                id="aporte-value"
                placeholder="R$ 1.000,00"
                value={aporteValue}
                onChange={(e) => setAporteValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-tolerance">Tolerância ao Risco</Label>
              <Select value={riskTolerance} onValueChange={(value: any) => setRiskTolerance(value)}>
                <SelectTrigger id="risk-tolerance">
                  <SelectValue placeholder="Selecione sua tolerância ao risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSERVADOR">Conservador</SelectItem>
                  <SelectItem value="MODERADO">Moderado</SelectItem>
                  <SelectItem value="ARROJADO">Arrojado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="investment-goal">Objetivo de Investimento</Label>
            <Select value={investmentGoal} onValueChange={(value: any) => setInvestmentGoal(value)}>
              <SelectTrigger id="investment-goal">
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RENDA">Foco em Renda</SelectItem>
                <SelectItem value="CRESCIMENTO">Foco em Crescimento</SelectItem>
                <SelectItem value="BALANCEADO">Balanceado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preferences">Preferências e Objetivos (Opcional)</Label>
            <Textarea
              id="preferences"
              placeholder="Ex: Prefiro FIIs de tijolo, busco dividend yield acima de 10%, evitar shopping centers..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={!aporteValue || investmentMutation.isPending}
            className="w-full md:w-auto"
          >
            {investmentMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analisando com IA...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Gerar Recomendações
              </>
            )}
          </Button>
          
          {investmentMutation.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{investmentMutation.error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recomendações de Distribuição
            </CardTitle>
            <CardDescription>
              Sugestões personalizadas para seu aporte de {formatCurrency(analysis.totalAporte)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Reasoning */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Estratégia Recomendada:</p>
                <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
              </div>

              {/* Portfolio Status */}
              {analysis.hasExistingPortfolio && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900">Carteira Atual Considerada</p>
                  </div>
                  <p className="text-sm text-blue-700">
                    Analisamos sua carteira atual para sugerir aportes que otimizem sua diversificação.
                  </p>
                </div>
              )}
              
              {/* Expected Yield */}
              {analysis.expectedYield && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Yield Esperado</p>
                  </div>
                  <p className="text-lg font-semibold text-green-700">{analysis.expectedYield.toFixed(2)}% ao ano</p>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-4">
                {analysis.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold">{rec.codigo}</h4>
                          <p className="text-sm text-muted-foreground">{rec.nome}</p>
                        </div>
                        <div className="flex gap-2">
                          {rec.priority && (
                            <Badge variant={rec.priority === 'ALTA' ? 'default' : rec.priority === 'MÉDIA' ? 'secondary' : 'outline'}>
                              {rec.priority}
                            </Badge>
                          )}
                          {rec.setor !== 'N/A' && <Badge variant="secondary">{rec.setor}</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{rec.percentual.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(rec.valor)}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.justificativa}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <PieChart className="h-4 w-4 mr-2" />
                  Ver Gráfico de Distribuição
                </Button>
                <Button className="flex-1">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Simular Novo Aporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}