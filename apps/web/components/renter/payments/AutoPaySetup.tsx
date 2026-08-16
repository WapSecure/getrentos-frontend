'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Shield, Zap } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { Switch } from '@getrentos/ui';

export const AutoPaySetup = () => {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">AutoPay</h3>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable AutoPay" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Automatically pay rent on time every month
        </p>
      </div>

      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Frequency
            </label>
            <Select
              value={frequency}
              onValueChange={setFrequency}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Payment Day of Month
            </label>
            <Select
              value={String(dayOfMonth)}
              onValueChange={(value) => setDayOfMonth(Number(value))}
              options={Array.from({ length: 28 }, (_, index) => ({
                value: String(index + 1),
                label: String(index + 1),
              }))}
            />
          </div>

          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-800 dark:text-green-300">
                  AutoPay is escrow-protected
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                  Your payments will be held in escrow until conditions are met
                </p>
              </div>
            </div>
          </div>

          <Button variant="primary" size="sm" fullWidth>
            <Zap className="w-4 h-4" />
            Activate AutoPay
          </Button>
        </motion.div>
      )}
    </div>
  );
};
