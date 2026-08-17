'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

const serviceAreaOptions = ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba'];
const propertyTypeOptions = [
  { value: 'APARTMENT', label: 'Apartments' },
  { value: 'DUPLEX', label: 'Duplexes' },
  { value: 'CONDO', label: 'Condos' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
];

export const BusinessPreferencesSettings = () => {
  const queryClient = useQueryClient();
  const [defaultCommissionRate, setDefaultCommissionRate] = useState('5');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: prefs } = useQuery({
    queryKey: realtorKeys.settingsPreferences,
    queryFn: () => unwrap(realtorService.getBusinessPreferences()),
  });

  useEffect(() => {
    if (!prefs) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefaultCommissionRate(String(prefs.commissionRate ?? 5));

    setServiceAreas(prefs.serviceAreas ?? []);

    setPropertyTypes(prefs.propertyTypes ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.commissionRate, prefs?.serviceAreas, prefs?.propertyTypes]);

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        realtorService.updateBusinessPreferences({
          commissionRate: Number(defaultCommissionRate) || 5,
          serviceAreas,
          propertyTypes,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsPreferences });
      setToast({ message: 'Business preferences saved.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to save your business preferences.',
        variant: 'error',
      }),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Business Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Defaults used across your listings and deals
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Default Commission Rate (%)
          </label>
          <LegacyInput
            type="number"
            min={1}
            max={100}
            value={defaultCommissionRate}
            onChange={(e) => setDefaultCommissionRate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Service Areas</label>
          <div className="flex flex-wrap gap-2">
            {serviceAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  serviceAreas.includes(area)
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Property Types</label>
          <div className="flex flex-wrap gap-2">
            {propertyTypeOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleType(type.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  propertyTypes.includes(type.value)
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
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

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
