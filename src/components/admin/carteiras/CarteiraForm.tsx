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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreatePortfolio, useUpdatePortfolio } from '@/hooks/admin/use-admin-carteiras';
import {
  createPortfolioSchema,
  CreatePortfolioData,
  PortfolioWithFunds,
} from '@/lib/validations/carteiras';
import { useToast } from '@/hooks/use-toast';

interface CarteiraFormProps {
  portfolio?: PortfolioWithFunds;
  onSuccess?: () => void;
}

export function CarteiraForm({ portfolio, onSuccess }: CarteiraFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!portfolio;

  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio(portfolio?.id || '');

  const form = useForm<CreatePortfolioData>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: portfolio?.name || '',
      description: portfolio?.description || '',
      isActive: portfolio?.isActive ?? true,
    },
  });

  const onSubmit = async (data: CreatePortfolioData) => {
    try {
      if (isEditing) {
        await updatePortfolio.mutateAsync(data);
        toast({
          title: 'Carteira atualizada',
          description: 'A carteira foi atualizada com sucesso.',
        });
      } else {
        const newPortfolio = await createPortfolio.mutateAsync(data);
        toast({
          title: 'Carteira criada',
          description: 'A carteira foi criada com sucesso.',
        });
        router.push(`/admin/carteiras/${newPortfolio.id}`);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.message || 'Ocorreu um erro ao salvar a carteira.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createPortfolio.isPending || updatePortfolio.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Editar Carteira' : 'Nova Carteira'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Carteira</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carteira Conservadora 2024"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome que identificará esta carteira recomendada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada da estratégia desta carteira..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explique a estratégia ou objetivo desta carteira recomendada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Carteira Ativa
                    </FormLabel>
                    <FormDescription>
                      Carteiras ativas são exibidas para os usuários
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditing
                    ? 'Atualizando...'
                    : 'Criando...'
                  : isEditing
                  ? 'Atualizar Carteira'
                  : 'Criar Carteira'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}