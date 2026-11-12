'use client';

import { CreditCard, Building2, Wallet, Trash2 } from '@sureground/icons';
import { useState } from 'react';
import { Alert, Card, ConfirmDialog, IconButton } from '@sureground/ui';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
}

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  onRemove: (id: string) => Promise<void>;
}

// Sureground never takes or keeps card details; details saved before are listed only so they can be removed.
export const PaymentMethods = ({ methods, onRemove }: PaymentMethodsProps) => {
  const [confirming, setConfirming] = useState<PaymentMethod | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return Building2;
      case 'wallet':
        return Wallet;
      default:
        return CreditCard;
    }
  };

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">How you pay</h2>
      </div>

      <div className="p-4">
        <Alert variant="info">
          You choose how to pay (card, bank transfer or USSD) on Paystack’s or Monnify’s secure page
          each time you pay. Sureground never sees or keeps your card details.
        </Alert>
      </div>

      {methods.length > 0 && (
        <>
          <p className="border-t border-border px-4 pt-3 text-xs text-muted-foreground">
            Details you saved here before. They aren’t used to pay, so you can remove them.
          </p>
          <div className="divide-y divide-border">
            {methods.map((method) => {
              const Icon = getIcon(method.type);
              return (
                <div key={method.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <p className="truncate text-sm text-foreground">{method.name}</p>
                  </div>
                  <IconButton
                    variant="danger"
                    size="sm"
                    label={`Remove ${method.name}`}
                    icon={<Trash2 aria-hidden="true" />}
                    onClick={() => setConfirming(method)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

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
        isLoading={isRemoving}
        onConfirm={async () => {
          if (!confirming) return;
          setIsRemoving(true);
          try {
            await onRemove(confirming.id);
          } finally {
            setIsRemoving(false);
          }
        }}
      />
    </Card>
  );
};
