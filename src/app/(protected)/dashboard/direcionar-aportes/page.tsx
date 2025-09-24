"use client";

import React, { useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, TrendingUp, PieChart, Calculator, Brain } from "lucide-react";

export default function DirecionarAportesPage() {
  const [aporteValue, setAporteValue] = useState("");
  const [preferences, setPreferences] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useSetPageMetadata({
    title: "Direcionador de Aportes FII",
    description: "Receba recomendações inteligentes para seus próximos aportes",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Direcionador de Aportes" }
    ]
  });

  const handleAnalyze = async () => {
    if (!aporteValue) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call - this would be replaced with actual API
    setTimeout(() => {
      setAnalysis({
        totalAporte: parseFloat(aporteValue.replace(/[^\d,]/g, '').replace(',', '.')),
        recommendations: [
          { codigo: "HGLG11", nome: "Cshg Logística", percentual: 35, valor: parseFloat(aporteValue.replace(/[^\d,]/g, '').replace(',', '.')) * 0.35, setor: "Logístico", justificativa: "Alta liquidez e bom dividend yield" },
          { codigo: "XPML11", nome: "XP Malls", percentual: 25, valor: parseFloat(aporteValue.replace(/[^\d,]/g, '').replace(',', '.')) * 0.25, setor: "Shopping", justificativa: "Diversificação setorial recomendada" },
          { codigo: "KNRI11", nome: "Kinea Renda Imobiliária", percentual: 20, valor: parseFloat(aporteValue.replace(/[^\d,]/g, '').replace(',', '.')) * 0.20, setor: "Corporativo", justificativa: "Estabilidade e crescimento consistente" },
          { codigo: "BCFF11", nome: "BTG Pactual Fundo de Fundos", percentual: 20, valor: parseFloat(aporteValue.replace(/[^\d,]/g, '').replace(',', '.')) * 0.20, setor: "Fundos", justificativa: "Exposição diversificada ao mercado" }
        ],
        reasoning: "Distribuição baseada na diversificação setorial e potencial de crescimento, considerando liquidez e dividend yield."
      });
      setIsAnalyzing(false);
    }, 2000);
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
            disabled={!aporteValue || isAnalyzing}
            className="w-full md:w-auto"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Gerar Recomendações
              </>
            )}
          </Button>
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
                        <Badge variant="secondary">{rec.setor}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{rec.percentual}%</p>
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