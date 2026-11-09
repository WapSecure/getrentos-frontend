'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DescriptionList,
  QueryState,
  useToast,
} from '@sureground/ui';
import { formatRelativeTime, unwrap } from '@sureground/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { adminKeys } from '@/lib/queryKeys';

/** A signed-out device loses access at its next refresh, within 15 minutes. */
export function SignedInDevices() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [confirmOthers, setConfirmOthers] = useState(false);

  const list = useQuery({
    queryKey: adminKeys.sessions,
    queryFn: () => unwrap(accountSecurityService.listSessions()),
    throwOnError: false,
  });
  const sessions = list.data ?? [];
  const others = sessions.filter((session) => !session.current);

  const signOutOne = useMutation({
    mutationFn: (id: string) => unwrap(accountSecurityService.signOutSession(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.sessions });
      toast.success('Signed out. That device loses access within 15 minutes.');
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'We could not sign that device out'),
  });

  const signOutOthers = useMutation({
    mutationFn: () => unwrap(accountSecurityService.signOutOtherSessions()),
    onSuccess: (res) => {
      setConfirmOthers(false);
      void queryClient.invalidateQueries({ queryKey: adminKeys.sessions });
      toast.success(
        res.revoked === 1
          ? 'Signed out 1 other device.'
          : `Signed out ${res.revoked} other devices.`
      );
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'We could not sign the other devices out'),
  });

  return (
    <Card static>
      <CardHeader
        action={
          others.length > 0 ? (
            <Button variant="outline" onClick={() => setConfirmOthers(true)}>
              Sign out other devices
            </Button>
          ) : undefined
        }
      >
        <CardTitle>Where you&apos;re signed in</CardTitle>
        <CardDescription>
          If you don&apos;t recognise a device, sign it out and change your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryState
          isLoading={list.isLoading}
          isError={list.isError && !list.data}
          onRetry={() => void list.refetch()}
          isRetrying={list.isFetching}
          errorTitle="We could not load your devices"
        >
          {sessions.length > 0 && (
            <DescriptionList
              items={sessions.map((session) => ({
                label: (
                  <span className="flex flex-wrap items-center gap-2">
                    {session.device}
                    {session.current && <Badge variant="success">This device</Badge>}
                  </span>
                ),
                value: (
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      {session.current
                        ? 'Active now'
                        : `Last active ${formatRelativeTime(session.lastActiveAt).toLowerCase()}`}
                      {session.ipAddress ? ` · ${session.ipAddress}` : ''}
                    </span>
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={signOutOne.isPending && signOutOne.variables === session.id}
                        onClick={() => signOutOne.mutate(session.id)}
                      >
                        Sign out
                      </Button>
                    )}
                  </span>
                ),
              }))}
            />
          )}
        </QueryState>
      </CardContent>

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
    </Card>
  );
}
