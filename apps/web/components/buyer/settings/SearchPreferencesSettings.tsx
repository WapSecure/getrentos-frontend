'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { SaveButton } from '@/components/ui/SaveButton';

const propertyTypeOptions = ['Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Land', 'Commercial'];

export const SearchPreferencesSettings = () => {
  const [minBudget, setMinBudget] = useState('50000000');
  const [maxBudget, setMaxBudget] = useState('150000000');
  const [preferredTypes, setPreferredTypes] = useState<string[]>(['Apartment', 'Duplex']);
  const [preferredLocations, setPreferredLocations] = useState('Lekki, Victoria Island, Ikoyi');
  const [notifyOnMatch, setNotifyOnMatch] = useState(true);

  const toggleType = (type: string) => {
    setPreferredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Search Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Used to personalize recommendations and match alerts
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Min Budget (₦)</label>
            <LegacyInput
              type="number"
              min={0}
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Max Budget (₦)</label>
            <LegacyInput
              type="number"
              min={0}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Preferred Property Types
          </label>
          <div className="flex flex-wrap gap-2">
            {propertyTypeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  preferredTypes.includes(type)
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Preferred Locations
          </label>
          <LegacyInput
            type="text"
            value={preferredLocations}
            onChange={(e) => setPreferredLocations(e.target.value)}
            placeholder="e.g. Lekki, Victoria Island"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer">
          <div className="flex items-start gap-3">
            <Bell className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-foreground">Notify me on matching new listings</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Get an alert when a property matches your saved criteria
              </p>
            </div>
          </div>
          <Toggle checked={notifyOnMatch} onChange={() => setNotifyOnMatch((v) => !v)} />
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
