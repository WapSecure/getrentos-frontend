'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Switch,
  useToast,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminPaymentProvidersService,
  type PaymentProviderStatus,
} from '@/services/adminPaymentProvidersService';

const KEY = ['admin', 'payment-providers'] as const;

/** What payers see for each company, in three states. */
function statusOf(p: PaymentProviderStatus): {
  label: string;
  variant: BadgeVariant;
  detail: string;
} {
  if (p.available) {
    return { label: 'Taking payments', variant: 'success', detail: 'Payers can choose it now.' };
  }
  if (!p.enabled) {
    return {
      label: 'Switched off',
      variant: 'neutral',
      detail: 'Payers see it greyed out with "switched off for now".',
    };
  }
  if (p.reason === 'is not set up') {
    return {
      label: 'Not set up',
      variant: 'warning',
      detail: 'Its keys are missing on the server, so it cannot be offered.',
    };
  }
  return {
    label: 'Resting after failures',
    variant: 'danger',
    detail:
      'It failed several times in the last few minutes, so payers are offered the other company. It comes back on its own after five minutes.',
  };
}

/**
 * Finance's switch for each payment company (Paystack, Monnify). Switching
 * one off stops it being offered to payers at once; payments already started
 * with it still complete. A company that keeps failing is taken out of the
 * list automatically for five minutes, shown here as resting.
 */
export default function PaymentProvidersPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canSwitch = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [confirming, setConfirming] = useState<PaymentProviderStatus | null>(null);
  const [note, setNote] = useState('');

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => unwrap(adminPaymentProvidersService.list()),
    refetchInterval: 30_000,
  });

  const toggle = useMutation({
    mutationFn: (p: PaymentProviderStatus) =>
      unwrap(adminPaymentProvidersService.set(p.provider, !p.enabled, note.trim() || undefined)),
    onSuccess: (data, p) => {
      queryClient.setQueryData(KEY, data);
      setConfirming(null);
      setNote('');
      const othersOn = data.some((o) => o.provider !== p.provider && o.available);
      if (p.enabled && !othersOn) {
        toast.error(`${p.label} is switched off. No company can take payments now.`);
      } else {
        toast.success(
          p.enabled
            ? `${p.label} is switched off. Payers are offered the other company.`
            : `${p.label} is switched back on.`
        );
      }
    },
    onError: (e: Error) => toast.error(e.message || 'Could not change the switch.'),
  });

  const providers = query.data ?? [];
  const anyOn = providers.filter((p) => p.available).length;
  // Switching this one off leaves no company taking payments (UX-45).
  const lastOneOn =
    confirming?.enabled === true &&
    !providers.some((p) => p.provider !== confirming.provider && p.available);

  return (
    <>
      <PageHeader
        title="Payment providers"
        description="Which companies payers can pay through. Switch one off when it is having problems; payers are offered the other straight away, and payments already started still complete."
      />

      {query.isLoading ? (
        <ListSkeleton variant="cards" rows={2} />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load payment providers"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : providers.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment providers"
          description="None are set up here."
        />
      ) : (
        <div className="space-y-3">
          {anyOn === 0 && (
            <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              No company can take payments right now: payers cannot pay anything until one is back.
            </Card>
          )}
          {providers.map((p) => {
            const status = statusOf(p);
            return (
              <Card key={p.provider} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{p.label}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{status.detail}</p>
                    {p.note && (
                      <p className="text-xs text-muted-foreground">
                        Note: {p.note}
                        {p.updatedAt ? ` · ${formatDate(p.updatedAt)}` : ''}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={p.enabled}
                    onCheckedChange={() => setConfirming(p)}
                    disabled={!canSwitch || toggle.isPending || p.reason === 'is not set up'}
                    aria-label={`${p.label} switched ${p.enabled ? 'on' : 'off'}`}
                  />
                </div>
                {!canSwitch && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Switching needs the rent-finance approval permission.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(null);
            setNote('');
          }
        }}
        title={
          confirming?.enabled
            ? `Switch ${confirming?.label} off?`
            : `Switch ${confirming?.label} back on?`
        }
        description={
          lastOneOn
            ? `No company will be able to take payments. Every payer is blocked until one is back on. Payments already started with ${confirming?.label ?? ''} still complete.`
            : confirming?.enabled
              ? `Payers will no longer be offered ${confirming.label}; they are offered the other company instead. Payments already started with ${confirming.label} still complete.`
              : `Payers can choose ${confirming?.label ?? ''} again straight away.`
        }
        tone={confirming?.enabled ? 'danger' : 'primary'}
        confirmLabel={
          lastOneOn
            ? 'Switch off and stop payments'
            : confirming?.enabled
              ? 'Switch off'
              : 'Switch on'
        }
        promptLabel="Why (shown to finance)"
        promptPlaceholder={
          confirming?.enabled
            ? 'e.g. Card payments timing out since 10:40'
            : 'e.g. Provider confirmed the issue is fixed'
        }
        promptValue={note}
        onPromptChange={setNote}
        isLoading={toggle.isPending}
        onConfirm={() => confirming && toggle.mutate(confirming)}
      />
    </>
  );
}
