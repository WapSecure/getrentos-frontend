'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Wallet, Plus, Trash2 } from 'lucide-react';
import { Button } from '@getrentos/ui';

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
  onSetDefault: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAdd: (data: { last4: string; expiry: string }) => Promise<void>;
}

export const PaymentMethods = ({ methods, onSetDefault, onRemove, onAdd }: PaymentMethodsProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');

  const getIcon = (type: string) => {
    switch (type) {
      case 'card':
        return CreditCard;
      case 'bank':
        return Building2;
      case 'wallet':
        return Wallet;
      default:
        return CreditCard;
    }
  };

  const handleAdd = async () => {
    if (!last4 || !expiry) return;
    await onAdd({ last4, expiry });
    setLast4('');
    setExpiry('');
    setShowAdd(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-foreground">Payment Methods</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your payment options</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {methods.map((method, index) => {
          const Icon = getIcon(method.type);
          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{method.name}</p>
                  {method.expiry && (
                    <p className="text-xs text-gray-500">Expires {method.expiry}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault && (
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                    Default
                  </span>
                )}
                {!method.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefault(method.id)}
                    className="min-h-9 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(method.id)}
                  aria-label={`Remove ${method.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/15"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showAdd && (
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <LegacyInput
              type="text"
              value={last4}
              onChange={(e) => setLast4(e.target.value)}
              placeholder="Last 4 digits"
              maxLength={4}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <LegacyInput
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-20 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="sm" onClick={handleAdd}>
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
