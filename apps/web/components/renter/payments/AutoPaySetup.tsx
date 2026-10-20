'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Shield, Zap } from 'lucide-react';
import { Alert, Button, Card, Field, Select, Switch } from '@getrentos/ui';

export const AutoPaySetup = () => {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);

  return (
    <Card>
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
          <Field label="Payment Frequency">
            <Select
              value={frequency}
              onValueChange={setFrequency}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </Field>

          <Field label="Payment Day of Month">
            <Select
              value={String(dayOfMonth)}
              onValueChange={(value) => setDayOfMonth(Number(value))}
              options={Array.from({ length: 28 }, (_, index) => ({
                value: String(index + 1),
                label: String(index + 1),
              }))}
            />
          </Field>

          <Alert variant="success" icon={Shield} title="AutoPay uses GetRentos Payment Protection">
            GetRentos holds each payment until the conditions are met
          </Alert>

          <Button variant="primary" size="sm" fullWidth icon={<Zap className="w-4 h-4" />}>
            Activate AutoPay
          </Button>
        </motion.div>
      )}
    </Card>
  );
};
