"use client";

import { useState } from "react";
import { useSetPageMetadata } from "@/contexts/page-metadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecomendacaoAporte } from "@/hooks/use-aporte";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RecomendacaoTable } from "@/components/aporte/recomendacao-table";
import { ResumoAlocacao } from "@/components/aporte/resumo-alocacao";

interface Portfolio {
  id: string;
  originalFileName: string;
  uploadedAt: string;
}

export default function DirecionarAportesPage() {
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [valorDisponivel, setValorDisponivel] = useState<string>("");

  const recomendacao = useRecomendacaoAporte();

  // Buscar portfolios do usuário
  const { data: portfolios, isLoading: loadingPortfolios, error: portfoliosError } = useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: () => api.get('/api/portfolios'),
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: true, // Recarregar ao montar componente
  });

  // Debug
  console.log('Portfolios:', portfolios);
  console.log('Loading:', loadingPortfolios);
  console.log('Error:', portfoliosError);

  useSetPageMetadata({
    title: "Direcionador de Aportes Inteligente",
    description: "Recomendações baseadas em desbalanceamento e oportunidades de desconto",
    breadcrumbs: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Direcionador de Aportes" }
    ]
  });

  const handleAnalyze = () => {
    if (!portfolioId) {
      toast.error('Selecione uma carteira');
      return;
    }

    if (!valorDisponivel) {
      toast.error('Digite o valor do aporte');
      return;
    }

    const valor = parseFloat(valorDisponivel.replace(/[^\d,]/g, '').replace(',', '.'));

    if (valor < 50) {
      toast.error('Valor mínimo: R$ 50,00');
      return;
    }

    if (valor > 1000000) {
      toast.error('Valor máximo: R$ 1.000.000,00');
      return;
    }

    recomendacao.mutate({
      portfolioId,
      valorDisponivel: valor,
    });
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Direcionador de Aportes Inteligente
        </h1>
        <p className="text-muted-foreground mt-2">
          Descubra onde investir com base em desbalanceamento da carteira e oportunidades de desconto
        </p>
      </div>

      {/* Formulário Simplificado */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Aporte</CardTitle>
          <CardDescription>
            Informe apenas o valor disponível e receba recomendações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seleção de Portfolio */}
            <div>
              <Label htmlFor="portfolio">Carteira</Label>
              {loadingPortfolios ? (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Carregando carteiras...</span>
                </div>
              ) : portfolios && portfolios.length > 0 ? (
                <Select value={portfolioId} onValueChange={setPortfolioId}>
                  <SelectTrigger id="portfolio">
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.originalFileName || `Carteira ${new Date(p.uploadedAt).toLocaleDateString('pt-BR')}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                  <AlertCircle className="h-4 w-4 text-warning-500" />
                  <span className="text-sm text-muted-foreground">
                    Você ainda não possui carteiras. <a href="/dashboard/avaliar-carteira" className="text-primary underline">Faça upload de uma carteira</a>
                  </span>
                </div>
              )}
            </div>

            {/* Valor do Aporte */}
            <div>
              <Label htmlFor="valor">Valor Disponível para Investir</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valor"
                  type="number"
                  min={50}
                  max={1000000}
                  step={100}
                  value={valorDisponivel}
                  onChange={(e) => setValorDisponivel(e.target.value)}
                  className="pl-10"
                  placeholder="10.000,00"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Valor mínimo: R$ 50,00 | Máximo: R$ 1.000.000,00
              </p>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!portfolioId || !valorDisponivel || recomendacao.isPending || loadingPortfolios}
            className="mt-6 w-full md:w-auto"
          >
            {recomendacao.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Gerar Recomendações
              </>
            )}
          </Button>

          {recomendacao.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error-500/10 text-error-500 border border-error-500/20 mt-4">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{recomendacao.error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {recomendacao.isSuccess && recomendacao.data && (
        <>
          {/* Resumo da Alocação */}
          <ResumoAlocacao resumo={recomendacao.data.resumo} />

          {/* Fundos Prioritários */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success-500" />
                Fundos Recomendados para Compra
              </CardTitle>
              <CardDescription>
                Fundos com melhor oportunidade de compra e rebalanceamento agora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecomendacaoTable fundos={recomendacao.data.fundosPrioritarios} />
            </CardContent>
          </Card>

          {/* Fundos para Aguardar */}
          {recomendacao.data.fundosAguardar && recomendacao.data.fundosAguardar.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning-500" />
                  Fundos para Aguardar Melhor Momento
                </CardTitle>
                <CardDescription>
                  Fundos desbalanceados mas sem desconto no momento - aguarde preços melhores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecomendacaoTable fundos={recomendacao.data.fundosAguardar} aguardar />
              </CardContent>
            </Card>
          )}

          {/* Fundos Acima do Ideal */}
          {recomendacao.data.fundosAcimaIdeal && recomendacao.data.fundosAcimaIdeal.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  Fundos Acima da Alocação Ideal
                </CardTitle>
                <CardDescription>
                  Fundos que você já possui em quantidade suficiente ou acima do recomendado - não é necessário aumentar exposição
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecomendacaoTable fundos={recomendacao.data.fundosAcimaIdeal} aguardar />
              </CardContent>
            </Card>
          )}

          {/* Informações sobre o Algoritmo */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary mb-2">Como funciona o algoritmo?</h4>
                  <p className="text-sm text-muted-foreground">
                    O sistema prioriza fundos combinando <strong>desbalanceamento da carteira</strong> (distância entre % atual e % ideal)
                    com <strong>oportunidades de desconto</strong> (preço atual vs preço teto). Fundos com maior score recebem prioridade
                    e o valor é distribuído sequencialmente até equilibrar a carteira.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Versão do Algoritmo:</strong> {recomendacao.data.metadata.versaoAlgoritmo} •
                    <strong> Processado em:</strong> {new Date(recomendacao.data.metadata.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
