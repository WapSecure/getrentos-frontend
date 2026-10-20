'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, CurrencyInput, Field, Input, Switch, ToggleChip, useToast } from '@getrentos/ui';
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
  const toast = useToast();

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
      toast.success('Search preferences saved.');
    },
    onError: (error) => toast.error(error.message || 'Failed to save search preferences.'),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Search Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Used to personalize recommendations and match alerts
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Min Budget">
            <CurrencyInput
              prefix="₦"
              min={0}
              value={minBudget}
              onValueChange={(v) => setMinBudget(v === 0 ? '' : String(v))}
              placeholder="e.g. 50,000,000"
            />
          </Field>
          <Field label="Max Budget">
            <CurrencyInput
              prefix="₦"
              min={0}
              value={maxBudget}
              onValueChange={(v) => setMaxBudget(v === 0 ? '' : String(v))}
              placeholder="e.g. 150,000,000"
            />
          </Field>
        </div>

        <div>
          <p className="block text-sm font-medium text-foreground mb-2">Preferred Property Types</p>
          <div role="group" aria-label="Preferred Property Types" className="flex flex-wrap gap-2">
            {propertyTypeOptions.map((type) => (
              <ToggleChip
                key={type}
                pressed={preferredTypes.includes(type)}
                onPressedChange={() => toggleType(type)}
              >
                {type}
              </ToggleChip>
            ))}
          </div>
        </div>

        <Field label="Preferred Locations">
          <Input
            value={preferredLocations}
            onChange={(e) => setPreferredLocations(e.target.value)}
            placeholder="e.g. Lekki, Victoria Island"
          />
        </Field>

        <div className="rounded-lg border border-border p-3">
          <Switch
            checked={notifyOnMatch}
            onCheckedChange={setNotifyOnMatch}
            label="Notify me on matching new listings"
            description="Get an alert when a property matches your saved criteria"
          />
        </div>
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
    </div>
  );
};
