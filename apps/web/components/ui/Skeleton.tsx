import { cn } from '@/lib/cn';

export const Skeleton = ({ className }: { className?: string }) => {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
};

export const PageLoadingState = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
