import { Skeleton } from '@/components/ui/skeleton';

export default function AIChatLoading() {
  return (
    <div className="flex flex-col h-screen p-6 space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="flex-1 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-3/4" />
        ))}
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
