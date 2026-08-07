'use client';

import { useState } from 'react';
import { RefreshCcw, Percent } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PreferencesSettings = () => {
  const [minOfferPct, setMinOfferPct] = useState('85');
  const [autoDeclineLowOffers, setAutoDeclineLowOffers] = useState(false);
  const [allowRentalConversion, setAllowRentalConversion] = useState(true);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Negotiation defaults and workspace preferences
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum acceptable offer (% of asking price)
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              min={0}
              max={100}
              value={minOfferPct}
              onChange={(e) => setMinOfferPct(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
            />
          </div>
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Auto-decline offers below minimum
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Offers under your threshold are rejected automatically
            </p>
          </div>
          <Toggle
            checked={autoDeclineLowOffers}
            onChange={() => setAutoDeclineLowOffers((v) => !v)}
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
          <div className="flex items-start gap-3">
            <RefreshCcw className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Allow property conversion to rental
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Lets you switch a verified property into your Landlord workspace to manage as a
                rental instead of a sale
              </p>
            </div>
          </div>
          <Toggle
            checked={allowRentalConversion}
            onChange={() => setAllowRentalConversion((v) => !v)}
          />
        </label>
      </div>

      <Button variant="primary" className="mt-6">
        Save Preferences
      </Button>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
      checked ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
