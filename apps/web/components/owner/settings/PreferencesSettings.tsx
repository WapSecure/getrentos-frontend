'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, Percent } from 'lucide-react';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';

export const PreferencesSettings = () => {
  const queryClient = useQueryClient();
  const [minOfferPct, setMinOfferPct] = useState('85');
  const [autoDeclineLowOffers, setAutoDeclineLowOffers] = useState(false);
  const [allowRentalConversion, setAllowRentalConversion] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: prefs } = useQuery({
    queryKey: ownerKeys.preferences,
    queryFn: () => unwrap(ownerService.getPreferences()),
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
      setToast({ message: 'Preferences saved.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Failed to save preferences.',
        variant: 'error',
      }),
  });

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

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        isLoading={save.isPending}
        disabled={!minOfferPct || save.isPending}
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
