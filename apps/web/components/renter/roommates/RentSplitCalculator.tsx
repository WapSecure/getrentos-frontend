'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';

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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Rent Split Calculator</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Calculate fair rent splits</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Total Monthly Rent
          </label>
          <CurrencyInput
            prefix="₦"
            value={totalRent}
            onValueChange={setTotalRent}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Split Method</label>
          <div className="flex gap-2">
            <Button
              variant={splitMethod === 'equal' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSplitMethodChange('equal')}
              className="flex-1"
            >
              Equal
            </Button>
            <Button
              variant={splitMethod === 'percentage' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSplitMethodChange('percentage')}
              className="flex-1"
            >
              By Share %
            </Button>
            <Button
              variant={splitMethod === 'custom' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleSplitMethodChange('custom')}
              className="flex-1"
            >
              Custom
            </Button>
          </div>
        </div>

        {splitMethod === 'custom' && (
          <div className="space-y-2">
            {roommates.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="text-sm text-foreground flex-1">{r.name}</span>
                <div className="w-20">
                  <CurrencyInput
                    value={customShares[r.id] || 0}
                    onValueChange={(v) => handleCustomShareChange(r.id, v)}
                    className="w-full px-2 py-1 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
    </div>
  );
};
