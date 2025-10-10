"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, AlertCircle, Coins } from "lucide-react";

interface ResumoAlocacaoProps {
  resumo: {
    totalInvestido: number;
    fundosRecomendados: number;
    equilibrioAlcancado: boolean;
    sobraValor?: number;
  };
}

export function ResumoAlocacao({ resumo }: ResumoAlocacaoProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Investido */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
              <h3 className="text-2xl font-bold text-primary mt-2">
                {formatCurrency(resumo.totalInvestido)}
              </h3>
            </div>
            <Coins className="h-10 w-10 text-primary opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Fundos Recomendados */}
      <Card className="border-info-500/20 bg-info-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fundos Recomendados</p>
              <h3 className="text-2xl font-bold text-info-500 mt-2">
                {resumo.fundosRecomendados}
              </h3>
            </div>
            <TrendingUp className="h-10 w-10 text-info-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Equilíbrio */}
      <Card className={`border-${resumo.equilibrioAlcancado ? 'success' : 'warning'}-500/20 bg-${resumo.equilibrioAlcancado ? 'success' : 'warning'}-500/5`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status Equilíbrio</p>
              <h3 className={`text-2xl font-bold text-${resumo.equilibrioAlcancado ? 'success' : 'warning'}-500 mt-2`}>
                {resumo.equilibrioAlcancado ? "Alcançado" : "Parcial"}
              </h3>
            </div>
            {resumo.equilibrioAlcancado ? (
              <CheckCircle2 className="h-10 w-10 text-success-500 opacity-50" />
            ) : (
              <AlertCircle className="h-10 w-10 text-warning-500 opacity-50" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sobra de Valor */}
      {resumo.sobraValor !== undefined && resumo.sobraValor > 0 && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Restante</p>
                <h3 className="text-2xl font-bold text-foreground mt-2">
                  {formatCurrency(resumo.sobraValor)}
                </h3>
              </div>
              <AlertCircle className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valor não alocado (não deu para comprar cotas completas)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
