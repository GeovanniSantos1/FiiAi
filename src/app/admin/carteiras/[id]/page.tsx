"use client";

import { Suspense, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Plus, BarChart3, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FundosTable } from '@/components/admin/carteiras/FundosTable';
import { BulkFundImportDialog } from '@/components/admin/carteiras/BulkFundImportDialog';
import { useAdminPortfolio, usePortfolioStats } from '@/hooks/admin/use-admin-carteiras';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CarteiraPageProps {
  params: Promise<{ id: string }>;
}

function PortfolioHeader({ portfolioId }: { portfolioId: string }) {
  const { data: portfolio, isLoading } = useAdminPortfolio(portfolioId);
  const stats = usePortfolioStats(portfolioId);
  const [showBulkImport, setShowBulkImport] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carteira não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/carteiras">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{portfolio.name}</h1>
            <Badge variant={portfolio.isActive ? 'default' : 'secondary'}>
              {portfolio.isActive ? 'Ativa' : 'Inativa'}
            </Badge>
          </div>
          {portfolio.description && (
            <p className="text-muted-foreground mt-1">{portfolio.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Criada {formatDistance(new Date(portfolio.createdAt), new Date(), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/carteiras/${portfolioId}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => setShowBulkImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Planilha
          </Button>
          <Button asChild>
            <Link href={`/admin/carteiras/${portfolioId}/fundos/novo`}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Fundo
            </Link>
          </Button>
        </div>

      {/* Bulk Import Dialog */}
      <BulkFundImportDialog
        portfolioId={portfolioId}
        portfolioName={portfolio.name}
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
      />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fundos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFunds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alocação Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAllocation.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.remainingAllocation > 0
                ? `${stats.remainingAllocation.toFixed(1)}% restante`
                : 'Alocação completa'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recomendações</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Comprar:</span>
                <span className="font-medium">{stats.fundsByRecommendation.BUY || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600">Aguardar:</span>
                <span className="font-medium">{stats.fundsByRecommendation.HOLD || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Vender:</span>
                <span className="font-medium">{stats.fundsByRecommendation.SELL || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segmentos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.fundsBySegment).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Diferentes segmentos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CarteiraPage({ params }: CarteiraPageProps) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <PortfolioHeader portfolioId={id} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <FundosTable
          portfolioId={id}
          portfolioName="" // This will be loaded by the component
        />
      </Suspense>
    </div>
  );
}