"use client";

import { useState, useMemo } from "react";
import { DollarSign, Search, Save, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useFundosPrecoTeto,
  useUpdatePrecoTeto,
  useBulkUpdatePrecoTeto,
  type FundoPrecoTeto,
} from "@/hooks/admin/use-admin-precos-teto";

export default function PrecoTetoPage() {
  const { data: fundos = [], isLoading } = useFundosPrecoTeto();
  const updatePrecoTeto = useUpdatePrecoTeto();
  const bulkUpdate = useBulkUpdatePrecoTeto();

  const [search, setSearch] = useState("");
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});

  // Filtrar fundos por busca
  const filteredFundos = useMemo(() => {
    if (!search) return fundos;
    const searchLower = search.toLowerCase();
    return fundos.filter(
      (fundo) =>
        fundo.ticker.toLowerCase().includes(searchLower) ||
        fundo.name.toLowerCase().includes(searchLower) ||
        fundo.portfolioName.toLowerCase().includes(searchLower)
    );
  }, [fundos, search]);

  // Contar fundos sem preço teto
  const fundosSemPreco = fundos.filter((f) => !f.ceilingPrice).length;
  const fundosComDesconto = fundos.filter((f) => f.desconto && f.desconto > 0).length;

  const handlePriceChange = (fundoId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedPrices((prev) => ({ ...prev, [fundoId]: numValue }));
    } else {
      setEditedPrices((prev) => {
        const newPrices = { ...prev };
        delete newPrices[fundoId];
        return newPrices;
      });
    }
  };

  const handleSaveAll = async () => {
    const updates = Object.entries(editedPrices).map(([fundoId, ceilingPrice]) => ({
      fundoId,
      ceilingPrice,
    }));

    if (updates.length === 0) {
      return;
    }

    await bulkUpdate.mutateAsync({ updates });
    setEditedPrices({});
  };

  const getDescontoColor = (desconto: number | null) => {
    if (desconto === null) return "text-muted-foreground";
    if (desconto > 10) return "text-success-500";
    if (desconto > 5) return "text-primary";
    if (desconto > 0) return "text-warning-500";
    return "text-error-500";
  };

  const getDescontoIcon = (desconto: number | null) => {
    if (desconto === null) return null;
    if (desconto > 0) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando fundos...</p>
        </div>
      </div>
    );
  }

  const hasChanges = Object.keys(editedPrices).length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            Preços Teto
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure os preços teto dos fundos para análise de descontos
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSaveAll}
            disabled={bulkUpdate.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações ({Object.keys(editedPrices).length})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fundos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fundos.length}</div>
            <p className="text-xs text-muted-foreground">Em todas as carteiras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Preço Teto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error-500">{fundosSemPreco}</div>
            <p className="text-xs text-muted-foreground">Aguardando configuração</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Desconto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-500">{fundosComDesconto}</div>
            <p className="text-xs text-muted-foreground">Oportunidades de compra</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      {fundosSemPreco > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Existem {fundosSemPreco} fundo(s) sem preço teto configurado. Configure os preços para
            que o sistema de direcionamento de aportes funcione corretamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ticker, nome ou carteira..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fundos e Preços Teto</CardTitle>
          <CardDescription>
            Configure o preço teto de cada fundo para análise de oportunidades de compra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Carteira</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">Preço Atual</TableHead>
                  <TableHead className="text-right">Preço Teto</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFundos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {search ? "Nenhum fundo encontrado" : "Nenhum fundo cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFundos.map((fundo) => {
                    const editedPrice = editedPrices[fundo.id];
                    const displayPrice = editedPrice ?? fundo.ceilingPrice;
                    const hasEdit = editedPrice !== undefined;

                    return (
                      <TableRow key={fundo.id}>
                        <TableCell className="font-medium">{fundo.ticker}</TableCell>
                        <TableCell>{fundo.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{fundo.portfolioName}</Badge>
                        </TableCell>
                        <TableCell>{fundo.segment}</TableCell>
                        <TableCell className="text-right">
                          R$ {fundo.currentPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={displayPrice ?? ""}
                            onChange={(e) => handlePriceChange(fundo.id, e.target.value)}
                            className={`w-28 text-right ${hasEdit ? "border-primary" : ""}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {fundo.desconto !== null ? (
                            <div
                              className={`flex items-center justify-end gap-1 ${getDescontoColor(
                                fundo.desconto
                              )}`}
                            >
                              {getDescontoIcon(fundo.desconto)}
                              <span className="font-medium">{fundo.desconto.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
