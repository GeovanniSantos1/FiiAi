import { Suspense } from 'react';
import { CarteirasTable } from '@/components/admin/carteiras/CarteirasTable';
import { Skeleton } from '@/components/ui/skeleton';

function CarteirasTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function CarteirasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Carteiras Recomendadas</h1>
        <p className="text-muted-foreground">
          Gerencie as carteiras de FIIs recomendadas para os usuários da plataforma
        </p>
      </div>

      <Suspense fallback={<CarteirasTableSkeleton />}>
        <CarteirasTable />
      </Suspense>
    </div>
  );
}