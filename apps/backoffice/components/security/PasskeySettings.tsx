'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, Trash2 } from 'lucide-react';
import {
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import { Button, IconButton, QueryState, useToast } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { adminKeys } from '@/lib/queryKeys';

const isCancelled = (err: unknown) =>
  err instanceof Error && /NotAllowedError|AbortError|cancel/i.test(`${err.name} ${err.message}`);

/**
 * Passkeys on the signed-in staff account: Face ID, a fingerprint or a security
 * key, used to confirm sensitive admin actions. Same flow as the main app's
 * security settings.
 */
export function PasskeySettings() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const list = useQuery({
    queryKey: adminKeys.passkeys,
    queryFn: () => unwrap(accountSecurityService.listPasskeys()),
    throwOnError: false,
  });
  const passkeys = list.data?.passkeys ?? [];

  const add = useMutation({
    mutationFn: async () => {
      const options = await unwrap(accountSecurityService.startPasskeyRegistration());
      // The browser asks for Face ID, a fingerprint or a security key here.
      const attestation = await startRegistration({
        optionsJSON: options as unknown as PublicKeyCredentialCreationOptionsJSON,
      });
      return unwrap(accountSecurityService.finishPasskeyRegistration(attestation, 'This device'));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.passkeys });
      toast.success('Passkey added');
    },
    onError: (err) => {
      // Closing the browser prompt is a choice, not a failure.
      if (isCancelled(err)) return;
      toast.error(err instanceof Error ? err.message : 'We could not add that passkey');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => unwrap(accountSecurityService.removePasskey(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.passkeys });
      toast.success('Passkey removed');
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'We could not remove that passkey'),
  });

  return (
    <div className="rounded-lg border border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg bg-info-subtle p-2">
            <Fingerprint className="h-5 w-5 text-info" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-foreground">Passkeys</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm sensitive actions with Face ID, a fingerprint or a security key. Optional, and
              used alongside your authenticator app.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => add.mutate()} isLoading={add.isPending}>
          Add passkey
        </Button>
      </div>

      <QueryState
        isLoading={list.isLoading}
        isError={list.isError && !list.data}
        onRetry={() => void list.refetch()}
        isRetrying={list.isFetching}
        errorTitle="We could not load your passkeys"
      >
        {passkeys.length > 0 && (
          <ul className="mt-4 space-y-2">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {passkey.deviceName || 'Passkey'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatDate(passkey.createdAt)}
                    {passkey.lastUsedAt ? ` · last used ${formatDate(passkey.lastUsedAt)}` : ''}
                  </p>
                </div>
                <IconButton
                  size="sm"
                  label="Remove passkey"
                  icon={<Trash2 />}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(passkey.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
