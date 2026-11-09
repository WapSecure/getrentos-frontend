'use client';

import { useQuery } from '@tanstack/react-query';
import { LogIn } from '@sureground/icons';
import { Badge, Button, Skeleton } from '@sureground/ui';
import { formatRelativeTime } from '@sureground/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { unwrap } from '@/lib/apiHelpers';
import { accountSecurityKeys } from '@/lib/queryKeys';

export const RecentSignIns = () => {
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: accountSecurityKeys.signIns,
    queryFn: () => unwrap(accountSecurityService.listRecentSignIns()),
    throwOnError: false,
  });

  return (
    <div className="p-4 rounded-lg border border-border">
      <div className="flex min-w-0 items-center gap-3">
        <div className="p-2 rounded-lg bg-info-subtle">
          <LogIn className="w-5 h-5 text-info" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">Recent sign-ins</h3>
          <p className="text-sm text-muted-foreground">
            We email you when a new device signs in. If one here wasn&apos;t you, change your
            password.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {data ? (
          data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((signIn) => (
                <li key={signIn.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-foreground">
                    {signIn.device}
                    {signIn.newDevice && <Badge variant="warning">New device</Badge>}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(signIn.at)}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : isError ? (
          <div className="flex flex-wrap items-center justify-between gap-2" role="alert">
            <p className="text-sm text-muted-foreground">We could not load your sign-ins.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              isLoading={isFetching}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
};
