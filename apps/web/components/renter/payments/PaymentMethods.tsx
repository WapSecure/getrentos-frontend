'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Wallet, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
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
                    onClick={() => onSetDefault(method.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => onRemove(method.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
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
