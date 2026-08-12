'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Building2, Wallet, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renterService, type PaymentMethod } from '@/services/renterService';

export const PaymentSettings = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listPaymentMethods();
      if (res.success && res.data) setMethods(res.data);
    };
    load();
  }, []);

  const handleSetDefault = async (id: string) => {
    const res = await renterService.setDefaultPaymentMethod(id);
    if (res.success && res.data) setMethods(res.data);
  };

  const handleRemove = async (id: string) => {
    const res = await renterService.removePaymentMethod(id);
    if (res.success) setMethods((prev) => prev.filter((m) => m.id !== id));
  };

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

        <Button href="/renter/payments" variant="outline" fullWidth className="gap-2">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>
    </div>
  );
};
