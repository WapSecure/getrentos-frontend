'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Percent } from 'lucide-react';
import { Button, Field, NumberInput, QueryState, Switch, useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';

export const PreferencesSettings = () => {
  const queryClient = useQueryClient();
  const [minOfferPct, setMinOfferPct] = useState('85');
  const [autoDeclineLowOffers, setAutoDeclineLowOffers] = useState(false);
  const [allowRentalConversion, setAllowRentalConversion] = useState(true);
  const toast = useToast();

  const {
    data: prefs,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ownerKeys.preferences,
    queryFn: () => unwrap(ownerService.getPreferences()),
    // Shown in place with a retry, so the other settings sections stay usable.
    throwOnError: false,
  });

  useEffect(() => {
    if (!prefs) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinOfferPct(String(prefs.minOfferPercent ?? 85));

    setAutoDeclineLowOffers(prefs.autoDeclineLowOffers ?? false);

    setAllowRentalConversion(prefs.allowRentalConversion ?? true);
  }, [prefs]);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        ownerService.updatePreferences({
          minOfferPercent: Number(minOfferPct) || 0,
          autoDeclineLowOffers,
          allowRentalConversion,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.preferences });
      toast.success('Preferences saved.');
    },
    onError: (error) => toast.error(error.message || 'Failed to save preferences.'),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Negotiation defaults and workspace preferences
      </p>

      {/* The form only appears once the saved values are in: showing the
          defaults on a failed load would let Save overwrite the real ones. */}
      <QueryState
        isLoading={isPending}
        isError={isError && !prefs}
        onRetry={() => void refetch()}
        isRetrying={isFetching}
        errorTitle="Your preferences did not load"
        errorDescription="Nothing has been changed. Try again to see and edit your saved preferences."
      >
        <div className="space-y-4">
          <Field label="Minimum acceptable offer (% of asking price)">
            <NumberInput
              min={0}
              max={100}
              value={minOfferPct}
              onValueChange={setMinOfferPct}
              leadingIcon={<Percent className="h-4 w-4" />}
            />
          </Field>

          <div className="rounded-lg border border-border p-3">
            <Switch
              checked={autoDeclineLowOffers}
              onCheckedChange={setAutoDeclineLowOffers}
              label="Auto-decline offers below minimum"
              description="Offers under your threshold are rejected automatically"
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <RefreshCcw className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <Switch
              className="flex-1"
              checked={allowRentalConversion}
              onCheckedChange={setAllowRentalConversion}
              label="Allow property conversion to rental"
              description="Lets you switch a verified property into your Landlord workspace to manage as a rental instead of a sale"
            />
          </div>
        </div>

        <Button
          variant="primary"
          className="mt-6"
          isLoading={save.isPending}
          disabled={!minOfferPct}
          onClick={() => save.mutate()}
        >
          Save Preferences
        </Button>
      </QueryState>
    </div>
  );
};
