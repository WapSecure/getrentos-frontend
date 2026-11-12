'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Building2, Wallet, Trash2 } from '@sureground/icons';
import {
  Alert,
  ConfirmDialog,
  IconButton,
  ListSkeleton,
  PageErrorState,
  useToast,
} from '@sureground/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export const PaymentSettings = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const methodsQuery = useQuery({
    queryKey: renterKeys.paymentMethods,
    queryFn: () => unwrap(renterService.listPaymentMethods()),
  });
  const methods = methodsQuery.data ?? [];
  const [confirming, setConfirming] = useState<(typeof methods)[number] | null>(null);

  const invalidateMethods = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.paymentMethods });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePaymentMethod(id)),
    onSuccess: () => {
      void invalidateMethods();
      toast.success('Payment method removed.');
    },
    onError: () => toast.error('The payment method could not be removed.'),
  });

  if (methodsQuery.isLoading) return <ListSkeleton rows={3} />;
  if (methodsQuery.isError && !methodsQuery.data) {
    return (
      <PageErrorState
        title="Payment methods are unavailable"
        onRetry={() => void methodsQuery.refetch()}
        isRetrying={methodsQuery.isFetching}
        headingLevel="h2"
      />
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Payment settings</h2>
      <Alert variant="info" className="mb-6">
        You choose how to pay (card, bank transfer or USSD) on Paystack’s or Monnify’s secure page
        each time you pay. Sureground never sees or keeps your card details, so there is nothing to
        add here.
      </Alert>

      {methods.length > 0 && (
        <p className="mb-3 text-sm text-muted-foreground">
          Details you saved here before. They aren’t used to pay, so you can remove them.
        </p>
      )}

      <div className="space-y-4">
        {methods.map((method) => {
          const Icon =
            method.type === 'card' ? CreditCard : method.type === 'bank' ? Building2 : Wallet;
          return (
            <div
              key={method.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{method.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <IconButton
                  variant="danger"
                  size="sm"
                  label={`Remove ${method.name}`}
                  onClick={() => setConfirming(method)}
                  disabled={removeMutation.isPending}
                  icon={<Trash2 />}
                />
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
        title="Remove this payment method?"
        description={
          confirming
            ? `"${confirming.name}" will be removed from your saved details. This can't be undone.`
            : ''
        }
        confirmLabel="Remove"
        tone="danger"
        isLoading={removeMutation.isPending}
        onConfirm={() => confirming && removeMutation.mutateAsync(confirming.id)}
      />
    </div>
  );
};
