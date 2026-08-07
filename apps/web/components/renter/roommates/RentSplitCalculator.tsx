'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

  const handleTotalRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalRent(Number(e.target.value));
  };

  const handleCustomShareChange = (roommateId: string, value: number) => {
    setCustomShares({
      ...customShares,
      [roommateId]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Rent Split Calculator</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Calculate fair rent splits
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total Monthly Rent
          </label>
          <input
            type="number"
            value={totalRent}
            onChange={handleTotalRentChange}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Split Method
          </label>
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
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{r.name}</span>
                <input
                  type="number"
                  value={customShares[r.id] || 0}
                  onChange={(e) => handleCustomShareChange(r.id, Number(e.target.value))}
                  className="w-20 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-white/10">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split Results</p>
          <div className="space-y-2">
            {splits.map((split) => (
              <div key={split.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">{split.name}</span>
                <span className="font-semibold text-[#c4a747]">{formatCurrency(split.amount)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between text-sm font-medium">
            <span className="text-gray-700 dark:text-gray-300">Total</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(totalRent)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
