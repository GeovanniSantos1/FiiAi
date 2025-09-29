"use client";

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CarteiraForm } from '@/components/admin/carteiras/CarteiraForm';
import { useAdminPortfolio } from '@/hooks/admin/use-admin-carteiras';

interface EditarCarteiraPageProps {
  params: { id: string };
}

function EditCarteiraContent({ portfolioId }: { portfolioId: string }) {
  const { data: portfolio, isLoading, error } = useAdminPortfolio(portfolioId);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !portfolio) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {error ? 'Erro ao carregar carteira' : 'Carteira não encontrada'}
        </p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/admin/carteiras">
            Voltar para lista
          </Link>
        </Button>
      </div>
    );
  }

  return <CarteiraForm portfolio={portfolio} />;
}

export default function EditarCarteiraPage({ params }: EditarCarteiraPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/carteiras/${params.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Carteira</h1>
          <p className="text-muted-foreground">
            Atualize as informações da carteira recomendada
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <EditCarteiraContent portfolioId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}