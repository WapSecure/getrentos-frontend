'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';

const propertyTypeOptions = ['Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Land', 'Commercial'];

export const SearchPreferencesSettings = () => {
  const queryClient = useQueryClient();
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState('');
  const [notifyOnMatch, setNotifyOnMatch] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: prefs } = useQuery({
    queryKey: buyerKeys.searchPreferences,
    queryFn: () => unwrap(buyerService.getSearchPreferences()),
  });

  useEffect(() => {
    if (!prefs) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinBudget(prefs.minBudget ? String(prefs.minBudget) : '');

    setMaxBudget(prefs.maxBudget ? String(prefs.maxBudget) : '');

    setPreferredTypes(prefs.preferredTypes ?? []);

    setPreferredLocations(prefs.preferredLocations ?? '');

    setNotifyOnMatch(prefs.notifyOnMatch ?? true);
  }, [prefs]);

  const toggleType = (type: string) => {
    setPreferredTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        buyerService.updateSearchPreferences({
          minBudget: Number(minBudget) || 0,
          maxBudget: Number(maxBudget) || 0,
          preferredTypes,
          preferredLocations,
          notifyOnMatch,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.searchPreferences });
      setToast({ message: 'Search preferences saved.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Failed to save search preferences.',
        variant: 'error',
      }),
  });

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
              placeholder="e.g. 50000000"
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
              placeholder="e.g. 150000000"
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

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        isLoading={save.isPending}
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        Save Preferences
      </Button>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
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
