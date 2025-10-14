import { Skeleton } from '@/components/ui/skeleton';

export default function DirecionarAportesLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
