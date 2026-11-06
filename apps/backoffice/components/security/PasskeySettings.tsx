'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import {
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
} from '@simplewebauthn/browser';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DescriptionList,
  IconButton,
  QueryState,
  useToast,
} from '@getrentos/ui';
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
    <Card static>
      <CardHeader
        action={
          <Button variant="outline" onClick={() => add.mutate()} isLoading={add.isPending}>
            Add passkey
          </Button>
        }
      >
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Confirm sensitive actions with Face ID, a fingerprint or a security key. Optional, and
          used alongside your authenticator app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QueryState
          isLoading={list.isLoading}
          isError={list.isError && !list.data}
          onRetry={() => void list.refetch()}
          isRetrying={list.isFetching}
          errorTitle="We could not load your passkeys"
        >
          {passkeys.length > 0 && (
            <DescriptionList
              items={passkeys.map((passkey) => ({
                label: passkey.deviceName || 'Passkey',
                value: (
                  <span className="flex items-center justify-between gap-3">
                    <span>
                      Added {formatDate(passkey.createdAt)}
                      {passkey.lastUsedAt ? ` · last used ${formatDate(passkey.lastUsedAt)}` : ''}
                    </span>
                    <IconButton
                      size="sm"
                      label="Remove passkey"
                      icon={<Trash2 />}
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(passkey.id)}
                    />
                  </span>
                ),
              }))}
            />
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}
