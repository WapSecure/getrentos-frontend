'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PauseCircle } from '@sureground/icons';
import { Alert, Button, Field, Textarea, useToast } from '@sureground/ui';
import { formatRelativeTime } from '@sureground/shared';
import { accountSecurityService } from '@/services/accountSecurityService';
import { unwrap } from '@/lib/apiHelpers';
import { accountSecurityKeys } from '@/lib/queryKeys';
import type { PayoutHold } from '@/types/accountSecurity';

const HoldRow = ({ hold }: { hold: PayoutHold }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [note, setNote] = useState('');
  const appeal = useMutation({
    mutationFn: () => unwrap(accountSecurityService.appealPayoutHold(hold.id, note.trim())),
    onSuccess: () => {
      setNote('');
      toast.success('Sent. The team will see it with your payout.');
      void queryClient.invalidateQueries({ queryKey: accountSecurityKeys.payoutHolds });
    },
  });

  return (
    <li className="space-y-3 py-3">
      <div>
        <p className="text-sm text-foreground">
          Paused {formatRelativeTime(hold.createdAt).toLowerCase()}
        </p>
        <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
          {hold.signals.map((signal) => (
            <li key={signal.rule}>{signal.reason}</li>
          ))}
        </ul>
      </div>
      {hold.appealedAt ? (
        <p className="text-sm text-muted-foreground">
          You told us: <span className="text-foreground">{hold.appealNote}</span>
        </p>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            appeal.mutate();
          }}
        >
          <Field
            label="Tell us your side"
            hint="For example, why your bank account changed. You can send this once."
          >
            <Textarea
              rows={2}
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          {appeal.error && <Alert variant="danger">{(appeal.error as Error).message}</Alert>}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="outline"
              isLoading={appeal.isPending}
              disabled={note.trim().length < 10}
            >
              Send to the team
            </Button>
          </div>
        </form>
      )}
    </li>
  );
};

/** Shown only while a payout is paused for a check. */
export const PayoutHolds = () => {
  const { data } = useQuery({
    queryKey: accountSecurityKeys.payoutHolds,
    queryFn: () => unwrap(accountSecurityService.listPayoutHolds()),
    throwOnError: false,
  });
  if (!data || data.length === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-warning/40 bg-warning-subtle/40">
      <div className="flex min-w-0 items-center gap-3">
        <div className="p-2 rounded-lg bg-warning-subtle">
          <PauseCircle className="w-5 h-5 text-warning" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">Paused payouts</h3>
          <p className="text-sm text-muted-foreground">
            Our team is checking {data.length === 1 ? 'a payout' : `${data.length} payouts`}. Most
            checks finish within one working day; we&apos;ll email you.
          </p>
        </div>
      </div>
      <ul className="mt-2 divide-y divide-border">
        {data.map((hold) => (
          <HoldRow key={hold.id} hold={hold} />
        ))}
      </ul>
    </div>
  );
};
