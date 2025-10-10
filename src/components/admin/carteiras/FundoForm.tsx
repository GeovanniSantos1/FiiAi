"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateFund, useUpdateFund, usePortfolioStats } from '@/hooks/admin/use-admin-carteiras';
import {
  createFundSchema,
  CreateFundData,
  RecommendedFundType,
  FundRecommendation,
} from '@/lib/validations/carteiras';
import { useToast } from '@/hooks/use-toast';

interface FundoFormProps {
  portfolioId: string;
  fund?: RecommendedFundType;
  onSuccess?: () => void;
}

const recommendationOptions: { value: FundRecommendation; label: string }[] = [
  { value: 'BUY', label: 'Comprar' },
  { value: 'SELL', label: 'Vender' },
  { value: 'HOLD', label: 'Aguardar' },
];

const segmentOptions = [
  'Logístico',
  'Shopping',
  'Corporativo',
  'Residencial',
  'Tijolo',
  'Papel',
  'Fundos',
  'Híbrido',
  'Outros',
];

export function FundoForm({ portfolioId, fund, onSuccess }: FundoFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!fund;

  const createFund = useCreateFund(portfolioId);
  const updateFund = useUpdateFund(portfolioId, fund?.id || '');
  const { remainingAllocation } = usePortfolioStats(portfolioId);

  const form = useForm<CreateFundData>({
    resolver: zodResolver(createFundSchema),
    defaultValues: {
      ticker: fund?.ticker || '',
      name: fund?.name || '',
      segment: fund?.segment || '',
      currentPrice: fund?.currentPrice || 0,
      averagePrice: fund?.averagePrice || 0,
      ceilingPrice: fund?.ceilingPrice || 0,
      allocation: fund?.allocation || 0,
      recommendation: fund?.recommendation || 'HOLD',
    },
  });

  const onSubmit = async (data: CreateFundData) => {
    try {
      // Validate allocation if creating new fund
      if (!isEditing) {
        const allocAfterAdd = remainingAllocation - data.allocation;
        if (allocAfterAdd < 0) {
          toast({
            title: 'Erro de Alocação',
            description: `A alocação excederia 100%. Máximo disponível: ${remainingAllocation.toFixed(1)}%`,
            variant: 'destructive',
          });
          return;
        }
      }

      if (isEditing) {
        await updateFund.mutateAsync(data);
        toast({
          title: 'Fundo atualizado',
          description: 'O fundo foi atualizado com sucesso.',
        });
      } else {
        await createFund.mutateAsync(data);
        toast({
          title: 'Fundo adicionado',
          description: 'O fundo foi adicionado à carteira com sucesso.',
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/admin/carteiras/${portfolioId}`);
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Ocorreu um erro ao salvar o fundo.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createFund.isPending || updateFund.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Fundo' : 'Adicionar Fundo'}
        </CardTitle>
        {!isEditing && (
          <p className="text-sm text-muted-foreground">
            Alocação disponível: {remainingAllocation.toFixed(1)}%
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ticker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticker</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="HGLG11"
                        {...field}
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Código do fundo (ex: HGLG11)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o segmento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {segmentOptions.map((segment) => (
                          <SelectItem key={segment} value={segment}>
                            {segment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Fundo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Hedge General Logistics"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome completo do fundo imobiliário
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="currentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Atual (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="156.78"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="averagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Médio (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="140.50"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ceilingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Teto (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="180.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Preço máximo recomendado para compra
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="allocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alocação (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="15.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentual recomendado na carteira (0-100%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recomendação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a recomendação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recommendationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Recomendação de ação para este fundo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? isEditing
                    ? 'Atualizando...'
                    : 'Adicionando...'
                  : isEditing
                  ? 'Atualizar Fundo'
                  : 'Adicionar Fundo'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}