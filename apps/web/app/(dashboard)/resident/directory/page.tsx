'use client';

import { useQuery } from '@tanstack/react-query';
import { Contact } from 'lucide-react';
import { EmptyState, ListSkeleton, Switch, useOptimisticMutation } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';

export default function ResidentDirectoryPage() {
  const { data: household } = useQuery({
    queryKey: estateResidentKeys.myHousehold,
    queryFn: () => unwrap(estateResidentService.getMyHousehold()),
  });

  const { data: directory, isLoading } = useQuery({
    queryKey: estateResidentKeys.directory,
    queryFn: () => unwrap(estateResidentService.getDirectory()),
  });

  const setOptIn = useOptimisticMutation({
    mutationFn: (optIn: boolean) => unwrap(estateResidentService.setDirectoryOptIn(optIn)),
    patches: (optIn) => [
      {
        queryKey: estateResidentKeys.myHousehold,
        update: (old) => ({ ...(old as object), directoryOptIn: optIn }),
      },
    ],
    invalidate: [estateResidentKeys.directory],
    errorMessage: 'Your directory preference did not save. Please try again.',
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Directory</h1>
        <p className="text-muted-foreground mt-1">Households in your estate who&apos;ve opted in</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Show my household in the directory</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Neighbors will see your unit, name, phone, and email.
          </p>
        </div>
        <Switch
          checked={household?.directoryOptIn ?? false}
          onCheckedChange={(checked) => setOptIn.mutate(checked)}
          aria-label="Show my household in the directory"
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !directory || directory.length === 0 ? (
        <EmptyState
          icon={Contact}
          title="No households listed yet"
          description="Households appear here once they opt in to the directory."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {directory.map((entry) => (
            <div key={entry.id} className="p-4">
              <p className="text-sm font-medium text-foreground">
                {entry.unitLabel}: {entry.residentName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.contactPhone ?? '—'}
                {entry.contactEmail ? ` · ${entry.contactEmail}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
