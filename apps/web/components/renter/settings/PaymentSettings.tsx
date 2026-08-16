'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Building2, Wallet, Plus, Trash2 } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

export const PaymentSettings = () => {
  const queryClient = useQueryClient();
  const { data: methods = [] } = useQuery({
    queryKey: renterKeys.paymentMethods,
    queryFn: () => unwrap(renterService.listPaymentMethods()),
  });

  const invalidateMethods = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.paymentMethods });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.setDefaultPaymentMethod(id)),
    onSuccess: invalidateMethods,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.removePaymentMethod(id)),
    onSuccess: invalidateMethods,
  });

  const handleSetDefault = (id: string) => setDefaultMutation.mutate(id);
  const handleRemove = (id: string) => removeMutation.mutate(id);

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
              className="flex items-center justify-between p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{method.name}</p>
                  {method.expiry && (
                    <p className="text-xs text-gray-500">Expires {method.expiry}</p>
                  )}
                </div>
                {method.isDefault && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!method.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(method.id)}>
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemove(method.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}

        <Button href={ROUTES.RENTER_PAYMENTS} variant="outline" fullWidth className="gap-2">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>
    </div>
  );
};
