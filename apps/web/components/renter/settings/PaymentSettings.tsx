'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Building2, Wallet, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, IconButton, ListSkeleton, PageErrorState, useToast } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

export const PaymentSettings = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const methodsQuery = useQuery({
    queryKey: renterKeys.paymentMethods,
    queryFn: () => unwrap(renterService.listPaymentMethods()),
  });
  const methods = methodsQuery.data ?? [];

  const invalidateMethods = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.paymentMethods });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.setDefaultPaymentMethod(id)),
    onSuccess: invalidateMethods,
    onError: () => toast.error('The default payment method could not be updated.'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePaymentMethod(id)),
    onSuccess: invalidateMethods,
    onError: () => toast.error('The payment method could not be removed.'),
  });

  const handleSetDefault = (id: string) => setDefaultMutation.mutate(id);
  const handleRemove = (id: string) => removeMutation.mutate(id);

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
      <h2 className="text-xl font-semibold text-foreground mb-4">Payment Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your payment methods and billing information
      </p>

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
                  {method.expiry && (
                    <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                  )}
                </div>
                {method.isDefault && <Badge variant="success">Default</Badge>}
              </div>
              <div className="flex gap-2">
                {!method.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(method.id)}
                    disabled={
                      setDefaultMutation.isPending && setDefaultMutation.variables !== method.id
                    }
                    isLoading={
                      setDefaultMutation.isPending && setDefaultMutation.variables === method.id
                    }
                  >
                    Set Default
                  </Button>
                )}
                <IconButton
                  variant="danger"
                  size="sm"
                  label={`Remove ${method.name}`}
                  onClick={() => handleRemove(method.id)}
                  isLoading={removeMutation.isPending && removeMutation.variables === method.id}
                  disabled={removeMutation.isPending && removeMutation.variables !== method.id}
                  icon={<Trash2 />}
                />
              </div>
            </div>
          );
        })}

        <Button
          href={ROUTES.RENTER_PAYMENTS}
          variant="outline"
          fullWidth
          icon={<Plus className="w-4 h-4" />}
        >
          Add Payment Method
        </Button>
      </div>
    </div>
  );
};
