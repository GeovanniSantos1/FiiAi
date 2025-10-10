"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { FundoPrioritizado } from "@/types/aporte";

interface RecomendacaoTableProps {
  fundos: FundoPrioritizado[];
  aguardar?: boolean;
}

export function RecomendacaoTable({ fundos, aguardar = false }: RecomendacaoTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (fundos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {aguardar ? "Nenhum fundo para aguardar no momento." : "Nenhuma recomendação disponível."}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {!aguardar && <TableHead className="w-[80px]">Prioridade</TableHead>}
            <TableHead>Fundo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead className="text-right">Atual</TableHead>
            <TableHead className="text-right">Ideal</TableHead>
            <TableHead className="text-right">Desbalanceamento</TableHead>
            <TableHead className="text-right">Desconto</TableHead>
            {!aguardar && (
              <>
                <TableHead className="text-right">Investir</TableHead>
                <TableHead className="text-right">Cotas</TableHead>
                <TableHead className="text-right">Pós-Aporte</TableHead>
              </>
            )}
            <TableHead className="max-w-xs">Justificativa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fundos.map((fundo) => (
            <TableRow key={fundo.fiiCode}>
              {!aguardar && (
                <TableCell className="font-bold text-center">
                  <Badge variant={fundo.prioridade === 1 ? "default" : "secondary"}>
                    #{fundo.prioridade}
                  </Badge>
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div>
                  <div className="font-bold">{fundo.fiiCode}</div>
                  <div className="text-sm text-muted-foreground">{fundo.fiiName}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{fundo.setor}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatPercentage(fundo.percentualAtual)}</TableCell>
              <TableCell className="text-right">{formatPercentage(fundo.percentualIdeal)}</TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    fundo.desbalanceamento > 0
                      ? "text-warning-500 font-medium"
                      : "text-success-500"
                  }
                >
                  {fundo.desbalanceamento > 0 ? "+" : ""}
                  {formatPercentage(fundo.desbalanceamento)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    fundo.percentualDesconto > 0
                      ? "text-success-500 font-medium"
                      : "text-error-500"
                  }
                >
                  {formatPercentage(fundo.percentualDesconto)}
                </span>
              </TableCell>
              {!aguardar && (
                <>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(fundo.valorInvestir || 0)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{fundo.cotasComprar || 0}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {formatPercentage(fundo.percentualPosAporte || 0)}
                    </Badge>
                  </TableCell>
                </>
              )}
              <TableCell className="max-w-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{fundo.justificativa}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{fundo.justificativa}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
