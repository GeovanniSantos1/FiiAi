"use client";

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminPortfolios, useDeletePortfolio } from '@/hooks/admin/use-admin-carteiras';
import { PortfolioWithFunds } from '@/lib/validations/carteiras';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CarteirasTable() {
  const { data: portfolios, isLoading, error } = useAdminPortfolios();
  const deletePortfolio = useDeletePortfolio();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioWithFunds | null>(null);

  const handleDelete = async () => {
    if (portfolioToDelete) {
      await deletePortfolio.mutateAsync(portfolioToDelete.id);
      setDeleteDialogOpen(false);
      setPortfolioToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carteiras Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
          <CardTitle>Carteiras Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar carteiras</p>
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

  if (!portfolios?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carteiras Recomendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhuma carteira encontrada
            </p>
            <Button asChild>
              <Link href="/admin/carteiras/nova">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira carteira
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
            <CardTitle>Carteiras Recomendadas</CardTitle>
            <Button asChild>
              <Link href="/admin/carteiras/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Carteira
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Fundos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolios.map((portfolio) => {
                const totalAllocation = portfolio.funds.reduce(
                  (sum, fund) => sum + fund.allocation,
                  0
                );

                return (
                  <TableRow key={portfolio.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/carteiras/${portfolio.id}`}
                        className="hover:underline"
                      >
                        {portfolio.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {portfolio.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">
                          {portfolio._count?.funds || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {totalAllocation.toFixed(1)}% alocado
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={portfolio.isActive ? 'default' : 'secondary'}>
                        {portfolio.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistance(new Date(portfolio.createdAt), new Date(), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
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
                            <Link href={`/admin/carteiras/${portfolio.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/carteiras/${portfolio.id}/editar`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setPortfolioToDelete(portfolio);
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
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a carteira "{portfolioToDelete?.name}"?
              Esta ação não pode ser desfeita e todos os fundos da carteira também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePortfolio.isPending}
            >
              {deletePortfolio.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}