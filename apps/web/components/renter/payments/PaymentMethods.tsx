'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Building2, Wallet, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, IconButton, Input, NumberInput } from '@getrentos/ui';

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
  const [adding, setAdding] = useState(false);

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
    setAdding(true);
    try {
      await onAdd({ last4, expiry });
      setLast4('');
      setExpiry('');
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-foreground">Payment Methods</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your payment options</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAdd(!showAdd)}
          >
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
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{method.name}</p>
                  {method.expiry && (
                    <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault && <Badge variant="success">Default</Badge>}
                {!method.isDefault && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-primary"
                    onClick={() => onSetDefault(method.id)}
                  >
                    Set default
                  </Button>
                )}
                <IconButton
                  variant="danger"
                  size="sm"
                  label={`Remove ${method.name}`}
                  icon={<Trash2 aria-hidden="true" />}
                  onClick={() => onRemove(method.id)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {showAdd && (
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <NumberInput
                value={last4}
                onValueChange={setLast4}
                placeholder="Last 4 digits"
                aria-label="Last 4 digits"
                maxLength={4}
              />
            </div>
            <Input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              aria-label="Expiry (MM/YY)"
              maxLength={5}
              className="w-24"
            />
            <Button size="sm" onClick={handleAdd} isLoading={adding}>
              Add
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
