"use client";

import { useState, useEffect } from "react";
import { useAdminRegrasAporte } from "@/hooks/admin/use-admin-regras-aporte";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, Info, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegrasAporteAdmin() {
  const { regras, isLoading, updateRegras } = useAdminRegrasAporte();
  const [localRegras, setLocalRegras] = useState({
    descontoMinimoAceitavel: 0,
    permitirSemDesconto: true,
    toleranciaDesbalanceamento: 2,
    pesoDesbalanceamento: 60,
    pesoDesconto: 40,
    limiteMaximoFundos: 5,
    alocacaoSequencial: true,
    nome: 'Regras Padrão',
    descricao: '',
  });

  // Sincronizar com dados do servidor
  useEffect(() => {
    if (regras) {
      setLocalRegras({
        descontoMinimoAceitavel: regras.descontoMinimoAceitavel,
        permitirSemDesconto: regras.permitirSemDesconto,
        toleranciaDesbalanceamento: regras.toleranciaDesbalanceamento,
        pesoDesbalanceamento: regras.pesoDesbalanceamento,
        pesoDesconto: regras.pesoDesconto,
        limiteMaximoFundos: regras.limiteMaximoFundos,
        alocacaoSequencial: regras.alocacaoSequencial,
        nome: regras.nome,
        descricao: regras.descricao || '',
      });
    }
  }, [regras]);

  const handleSave = async () => {
    await updateRegras.mutateAsync(localRegras);
  };

  const handleReset = () => {
    if (regras) {
      setLocalRegras({
        descontoMinimoAceitavel: regras.descontoMinimoAceitavel,
        permitirSemDesconto: regras.permitirSemDesconto,
        toleranciaDesbalanceamento: regras.toleranciaDesbalanceamento,
        pesoDesbalanceamento: regras.pesoDesbalanceamento,
        pesoDesconto: regras.pesoDesconto,
        limiteMaximoFundos: regras.limiteMaximoFundos,
        alocacaoSequencial: regras.alocacaoSequencial,
        nome: regras.nome,
        descricao: regras.descricao || '',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" />
          Regras de Direcionamento de Aportes
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure como o algoritmo prioriza fundos para recomendações de investimento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEÇÃO 1: REGRAS DE DESCONTO */}
        <Card>
          <CardHeader>
            <CardTitle>Regras de Desconto</CardTitle>
            <CardDescription>
              Define como o sistema avalia oportunidades de preço
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="desconto-minimo">Desconto Mínimo Aceitável</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apenas fundos com desconto maior ou igual a este valor serão recomendados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="desconto-minimo"
                  min={0}
                  max={20}
                  step={0.5}
                  value={[localRegras.descontoMinimoAceitavel]}
                  onValueChange={(val) =>
                    setLocalRegras({ ...localRegras, descontoMinimoAceitavel: val[0] })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {localRegras.descontoMinimoAceitavel.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="permitir-sem-desconto">Permitir Investir Sem Desconto</Label>
                <p className="text-sm text-muted-foreground">
                  Se ativado, recomenda fundos mesmo com desconto mínimo
                </p>
              </div>
              <Switch
                id="permitir-sem-desconto"
                checked={localRegras.permitirSemDesconto}
                onCheckedChange={(checked) =>
                  setLocalRegras({ ...localRegras, permitirSemDesconto: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: REGRAS DE BALANCEAMENTO */}
        <Card>
          <CardHeader>
            <CardTitle>Regras de Balanceamento</CardTitle>
            <CardDescription>
              Controla priorização entre desbalanceamento e desconto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Pesos do Cálculo de Prioridade</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Define a importância relativa de cada fator (total = 100%)
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Peso Desbalanceamento</span>
                    <span className="text-sm font-medium">{localRegras.pesoDesbalanceamento}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[localRegras.pesoDesbalanceamento]}
                    onValueChange={(val) => {
                      setLocalRegras({
                        ...localRegras,
                        pesoDesbalanceamento: val[0],
                        pesoDesconto: 100 - val[0],
                      });
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Peso Desconto</span>
                    <span className="text-sm font-medium">{localRegras.pesoDesconto}%</span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[localRegras.pesoDesconto]}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajustado automaticamente (soma = 100%)
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="tolerancia">Tolerância ao Desbalanceamento</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Aceita diferença de até ±X% entre atual e ideal
              </p>
              <div className="flex items-center gap-4">
                <Slider
                  id="tolerancia"
                  min={0}
                  max={10}
                  step={0.5}
                  value={[localRegras.toleranciaDesbalanceamento]}
                  onValueChange={(val) =>
                    setLocalRegras({ ...localRegras, toleranciaDesbalanceamento: val[0] })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  ±{localRegras.toleranciaDesbalanceamento.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: REGRAS DE RECOMENDAÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle>Regras de Recomendação</CardTitle>
            <CardDescription>
              Controla como as recomendações são apresentadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="limite-fundos">Limite Máximo de Fundos</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Número máximo de fundos na lista de recomendações
              </p>
              <Input
                id="limite-fundos"
                type="number"
                min={1}
                max={20}
                value={localRegras.limiteMaximoFundos}
                onChange={(e) =>
                  setLocalRegras({ ...localRegras, limiteMaximoFundos: parseInt(e.target.value) || 5 })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alocacao-sequencial">Alocação Sequencial</Label>
                <p className="text-sm text-muted-foreground">
                  Se ativado, preenche gap do #1 antes de ir para #2
                </p>
              </div>
              <Switch
                id="alocacao-sequencial"
                checked={localRegras.alocacaoSequencial}
                onCheckedChange={(checked) =>
                  setLocalRegras({ ...localRegras, alocacaoSequencial: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 4: PREVIEW DO IMPACTO */}
        <Card>
          <CardHeader>
            <CardTitle>Preview do Impacto</CardTitle>
            <CardDescription>
              Visualize como as mudanças afetam as recomendações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Exemplo de Priorização</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fundo A: 8% desbal. + 10% desconto</span>
                    <span className="font-medium">
                      Score: {((8 * localRegras.pesoDesbalanceamento / 100) + (10 * localRegras.pesoDesconto / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fundo B: 5% desbal. + 15% desconto</span>
                    <span className="font-medium">
                      Score: {((5 * localRegras.pesoDesbalanceamento / 100) + (15 * localRegras.pesoDesconto / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fundo C: 10% desbal. + 2% desconto</span>
                    <span className="font-medium">
                      Score: {((10 * localRegras.pesoDesbalanceamento / 100) + (2 * localRegras.pesoDesconto / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-primary/5">
                <h4 className="font-medium mb-2 text-primary">Recomendações com Base Atual</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>
                    {localRegras.permitirSemDesconto
                      ? "Fundos com qualquer desconto serão recomendados"
                      : `Apenas fundos com desconto ≥ ${localRegras.descontoMinimoAceitavel}%`}
                  </li>
                  <li>
                    Priorização: {localRegras.pesoDesbalanceamento > localRegras.pesoDesconto
                      ? "Desbalanceamento mais importante"
                      : "Desconto mais importante"}
                  </li>
                  <li>Máximo de {localRegras.limiteMaximoFundos} fundos recomendados</li>
                  <li>
                    Alocação: {localRegras.alocacaoSequencial ? "Sequencial (preenche #1 primeiro)" : "Distribuída"}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AÇÕES */}
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" onClick={handleReset} disabled={updateRegras.isPending}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar Mudanças
        </Button>
        <Button onClick={handleSave} disabled={updateRegras.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateRegras.isPending ? "Salvando..." : "Salvar Regras"}
        </Button>
      </div>
    </div>
  );
}
