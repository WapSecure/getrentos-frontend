'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MonitorSmartphone } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Skeleton, useToast } from '@sureground/ui';
import { formatRelativeTime } from '@sureground/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { unwrap } from '@/lib/apiHelpers';
import { accountSecurityKeys } from '@/lib/queryKeys';

// A signed-out device loses access at its next refresh, so the copy says "within 15 minutes", not "now".
export const SignedInDevices = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmOthers, setConfirmOthers] = useState(false);

  const {
    data: sessions,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: accountSecurityKeys.sessions,
    queryFn: () => unwrap(accountSecurityService.listSessions()),
    throwOnError: false,
  });

  const signOutOne = useMutation({
    mutationFn: (id: string) => unwrap(accountSecurityService.signOutSession(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.sessions });
      toast.success('Signed out. That device loses access within 15 minutes.');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not sign that device out'),
  });

  const signOutOthers = useMutation({
    mutationFn: () => unwrap(accountSecurityService.signOutOtherSessions()),
    onSuccess: (res) => {
      setConfirmOthers(false);
      queryClient.invalidateQueries({ queryKey: accountSecurityKeys.sessions });
      toast.success(
        res.revoked === 1
          ? 'Signed out 1 other device.'
          : `Signed out ${res.revoked} other devices.`
      );
    },
    onError: (err: Error) => toast.error(err.message || 'Could not sign the other devices out'),
  });

  const others = sessions?.filter((s) => !s.current) ?? [];

  return (
    <div className="p-4 rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="p-2 rounded-lg bg-info-subtle">
            <MonitorSmartphone className="w-5 h-5 text-info" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">Where you&apos;re signed in</h3>
            <p className="text-sm text-muted-foreground">
              If you don&apos;t recognise a device, sign it out and change your password.
            </p>
          </div>
        </div>
        {others.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setConfirmOthers(true)}>
            Sign out other devices
          </Button>
        )}
      </div>

      <div className="mt-4">
        {sessions ? (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/50 border border-border"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    {session.device}
                    {session.current && <Badge variant="success">This device</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.current
                      ? 'Active now'
                      : `Last active ${formatRelativeTime(session.lastActiveAt).toLowerCase()}`}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ''}
                  </p>
                </div>
                {!session.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOutOne.mutate(session.id)}
                    isLoading={signOutOne.isPending && signOutOne.variables === session.id}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="flex flex-wrap items-center justify-between gap-2" role="alert">
            <p className="text-sm text-muted-foreground">We could not load your devices.</p>
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
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOthers}
        onOpenChange={setConfirmOthers}
        title="Sign out other devices?"
        description={`This keeps you signed in here and signs out ${
          others.length === 1 ? '1 other device' : `${others.length} other devices`
        } within 15 minutes. You'll be asked to confirm it's you.`}
        confirmLabel="Sign out other devices"
        onConfirm={() => signOutOthers.mutate()}
        isLoading={signOutOthers.isPending}
      />
    </div>
  );
};
