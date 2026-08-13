'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { RefreshCcw, Percent } from 'lucide-react';
import { SaveButton } from '@/components/ui/SaveButton';

export const PreferencesSettings = () => {
  const [minOfferPct, setMinOfferPct] = useState('85');
  const [autoDeclineLowOffers, setAutoDeclineLowOffers] = useState(false);
  const [allowRentalConversion, setAllowRentalConversion] = useState(true);

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Negotiation defaults and workspace preferences
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Minimum acceptable offer (% of asking price)
          </label>
          <div className="relative">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="number"
              min={0}
              max={100}
              value={minOfferPct}
              onChange={(e) => setMinOfferPct(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer">
          <div>
            <p className="text-sm text-foreground">Auto-decline offers below minimum</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Offers under your threshold are rejected automatically
            </p>
          </div>
          <Toggle
            checked={autoDeclineLowOffers}
            onChange={() => setAutoDeclineLowOffers((v) => !v)}
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer">
          <div className="flex items-start gap-3">
            <RefreshCcw className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-foreground">Allow property conversion to rental</p>
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

      <SaveButton label="Save Preferences" className="mt-6" />
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
      checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
