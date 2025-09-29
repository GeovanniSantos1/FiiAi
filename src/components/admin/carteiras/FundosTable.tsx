"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioFunds, useDeleteFund } from '@/hooks/admin/use-admin-carteiras';
import { RecommendationBadge } from './RecommendationBadge';
import { RecommendedFundType } from '@/lib/validations/carteiras';

interface FundosTableProps {
  portfolioId: string;
  portfolioName: string;
}

export function FundosTable({ portfolioId, portfolioName }: FundosTableProps) {
  const { data: funds, isLoading, error } = usePortfolioFunds(portfolioId);
  const deleteFund = useDeleteFund(portfolioId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<RecommendedFundType | null>(null);

  const handleDelete = async () => {
    if (fundToDelete) {
      await deleteFund.mutateAsync(fundToDelete.id);
      setDeleteDialogOpen(false);
      setFundToDelete(null);
    }
  };

  const totalAllocation = funds?.reduce((sum, fund) => sum + fund.allocation, 0) || 0;
  const remainingAllocation = 100 - totalAllocation;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fundos da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fundos da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar fundos</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!funds?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fundos da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhum fundo adicionado ainda
            </p>
            <Button asChild>
              <Link href={`/admin/carteiras/${portfolioId}/fundos/novo`}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro fundo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fundos da Carteira</CardTitle>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>Total de fundos: {funds.length}</span>
                <span>Alocação total: {totalAllocation.toFixed(1)}%</span>
                <span className={remainingAllocation < 0 ? 'text-destructive' : ''}>
                  Restante: {remainingAllocation.toFixed(1)}%
                </span>
              </div>
            </div>
            <Button asChild>
              <Link href={`/admin/carteiras/${portfolioId}/fundos/novo`}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Fundo
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead className="text-right">Preço Atual</TableHead>
                <TableHead className="text-right">Preço Médio</TableHead>
                <TableHead className="text-right">Preço Teto</TableHead>
                <TableHead className="text-center">Alocação</TableHead>
                <TableHead className="text-center">Recomendação</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funds.map((fund) => (
                <TableRow key={fund.id}>
                  <TableCell className="font-medium">
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      {fund.ticker}
                    </code>
                  </TableCell>
                  <TableCell>{fund.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{fund.segment}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {fund.currentPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {fund.averagePrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {fund.ceilingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={fund.allocation > 0 ? 'default' : 'secondary'}
                    >
                      {fund.allocation.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <RecommendationBadge recommendation={fund.recommendation} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/carteiras/${portfolioId}/fundos/${fund.id}/editar`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setFundToDelete(fund);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {remainingAllocation < 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ⚠️ A alocação total excede 100%. Ajuste as alocações dos fundos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fundo "{fundToDelete?.ticker} - {fundToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFund.isPending}
            >
              {deleteFund.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}