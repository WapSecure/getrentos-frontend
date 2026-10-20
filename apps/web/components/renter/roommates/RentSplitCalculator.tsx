'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CurrencyInput, Field, NumberInput, SegmentedControl } from '@getrentos/ui';

interface Roommate {
  id: string;
  name: string;
  sharePercentage: number;
}

interface RentSplitCalculatorProps {
  roommates: Roommate[];
}

type SplitMethod = 'equal' | 'percentage' | 'custom';

export const RentSplitCalculator = ({ roommates }: RentSplitCalculatorProps) => {
  const [totalRent, setTotalRent] = useState<number>(600000);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [customShares, setCustomShares] = useState<Record<string, number>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSplit = () => {
    if (splitMethod === 'equal') {
      const share = totalRent / roommates.length;
      return roommates.map((r) => ({
        ...r,
        amount: share,
      }));
    } else if (splitMethod === 'percentage') {
      return roommates.map((r) => ({
        ...r,
        amount: (totalRent * r.sharePercentage) / 100,
      }));
    } else {
      const totalCustom = Object.values(customShares).reduce((sum, val) => sum + val, 0);
      if (totalCustom === 0) {
        return roommates.map((r) => ({
          ...r,
          amount: totalRent / roommates.length,
        }));
      }
      return roommates.map((r) => ({
        ...r,
        amount: (totalRent * (customShares[r.id] || 0)) / totalCustom,
      }));
    }
  };

  const splits = calculateSplit();

  const handleSplitMethodChange = (method: SplitMethod) => {
    setSplitMethod(method);
  };

  const handleCustomShareChange = (roommateId: string, value: number) => {
    setCustomShares({
      ...customShares,
      [roommateId]: value,
    });
  };

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Rent Split Calculator</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Calculate fair rent splits</p>
      </div>

      <div className="p-4 space-y-4">
        <Field label="Total rent">
          <CurrencyInput prefix="₦" value={totalRent} onValueChange={setTotalRent} />
        </Field>

        <div>
          <p className="block text-sm font-medium text-foreground mb-1" id="split-method-label">
            Split Method
          </p>
          <SegmentedControl
            aria-label="Split Method"
            value={splitMethod}
            onValueChange={handleSplitMethodChange}
            size="sm"
            segments={[
              { value: 'equal', label: 'Equal' },
              { value: 'percentage', label: 'By Share %' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
        </div>

        {splitMethod === 'custom' && (
          <div className="space-y-2">
            {roommates.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="min-w-0 text-sm text-foreground flex-1">{r.name}</span>
                <div className="w-24">
                  <NumberInput
                    aria-label={`Share for ${r.name}`}
                    value={customShares[r.id] || ''}
                    onValueChange={(v) => handleCustomShareChange(r.id, Number(v) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-2">Split Results</p>
          <div className="space-y-2">
            {splits.map((split) => (
              <div key={split.id} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{split.name}</span>
                <span className="font-semibold text-primary">{formatCurrency(split.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm font-medium">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatCurrency(totalRent)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
