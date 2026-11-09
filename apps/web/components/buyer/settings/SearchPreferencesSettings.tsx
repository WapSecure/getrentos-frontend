'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { Button, CurrencyInput, Field, Switch, ToggleChip, useToast } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import { AddressInput } from '@/components/shared/location/AddressInput';

const propertyTypeOptions = ['Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Land', 'Commercial'];

export const SearchPreferencesSettings = () => {
  const queryClient = useQueryClient();
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  // Stored as one comma-separated line ("Lekki, Victoria Island"), shown as chips.
  const [preferredLocations, setPreferredLocations] = useState('');
  const [newLocation, setNewLocation] = useState('');
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

  const locations = preferredLocations
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  /** Adds a typed area, or the area picked from the suggestions, then clears the box. */
  const addLocation = (name = newLocation) => {
    const area = name.trim();
    if (area.length < 2) return;
    if (!locations.some((l) => l.toLowerCase() === area.toLowerCase())) {
      setPreferredLocations([...locations, area].join(', '));
    }
    setNewLocation('');
  };
  const removeLocation = (area: string) =>
    setPreferredLocations(locations.filter((l) => l !== area).join(', '));

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
      <h2 className="text-xl font-semibold text-foreground mb-4">Search preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Used to personalise recommendations and match alerts
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Min budget">
            <CurrencyInput
              prefix="₦"
              min={0}
              value={minBudget}
              onValueChange={(v) => setMinBudget(v === 0 ? '' : String(v))}
              placeholder="e.g. 50,000,000"
            />
          </Field>
          <Field label="Max budget">
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
          <p className="block text-sm font-medium text-foreground mb-2">Preferred property types</p>
          <div role="group" aria-label="Preferred property types" className="flex flex-wrap gap-2">
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

        <div>
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addLocation();
            }}
          >
            <Field label="Preferred locations" className="flex-1">
              <AddressInput
                kind="area"
                allowManual
                value={newLocation ? { text: newLocation } : null}
                placeholder="e.g. Lekki"
                onChange={(next) =>
                  next?.verified
                    ? addLocation(next.verified.line1)
                    : setNewLocation(next?.text ?? '')
                }
              />
            </Field>
            <Button type="submit" variant="outline" disabled={newLocation.trim().length < 2}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Button>
          </form>
          {locations.length > 0 && (
            <div
              role="group"
              aria-label="Preferred locations"
              className="mt-2 flex flex-wrap gap-2"
            >
              {locations.map((area) => (
                <ToggleChip
                  key={area}
                  pressed
                  size="sm"
                  aria-label={`Remove ${area}`}
                  onPressedChange={() => removeLocation(area)}
                >
                  {area}
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </ToggleChip>
              ))}
            </div>
          )}
        </div>

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
        Save preferences
      </Button>
    </div>
  );
};
