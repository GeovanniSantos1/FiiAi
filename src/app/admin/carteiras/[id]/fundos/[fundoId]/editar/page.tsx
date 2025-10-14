"use client";

import { Suspense, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FundoForm } from '@/components/admin/carteiras/FundoForm';
import { usePortfolioFund } from '@/hooks/admin/use-admin-carteiras';

interface EditarFundoPageProps {
  params: Promise<{ id: string; fundoId: string }>;
}

function EditFundoContent({ portfolioId, fundoId }: { portfolioId: string; fundoId: string }) {
  const { data: fund, isLoading, error } = usePortfolioFund(portfolioId, fundoId);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !fund) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {error ? 'Erro ao carregar fundo' : 'Fundo não encontrado'}
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href={`/admin/carteiras/${portfolioId}`}>
            Voltar para carteira
          </Link>
        </Button>
      </div>
    );
  }

  return <FundoForm portfolioId={portfolioId} fund={fund} />;
}

export default function EditarFundoPage({ params }: EditarFundoPageProps) {
  const { id, fundoId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/carteiras/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Fundo</h1>
          <p className="text-muted-foreground">
            Atualize as informações do fundo na carteira
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <EditFundoContent portfolioId={id} fundoId={fundoId} />
        </Suspense>
      </div>
    </div>
  );
}