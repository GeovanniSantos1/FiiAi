import { Skeleton } from '@/components/ui/skeleton';

export function PortfolioSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <Skeleton className="h-12 w-full" />

      {/* Chart Area */}
      <Skeleton className="h-64 w-full" />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>

      {/* Table */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
