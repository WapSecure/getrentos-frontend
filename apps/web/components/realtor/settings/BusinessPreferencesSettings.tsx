'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, NumberInput, useToast } from '@getrentos/ui';
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
  const toast = useToast();

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
      toast.success('Business preferences saved.');
    },
    onError: (error) => toast.error(error.message || 'Unable to save your business preferences.'),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Business Preferences</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Defaults used across your listings and deals
      </p>

      <div className="space-y-4">
        <Field label="Default Commission Rate (%)">
          <NumberInput
            min={1}
            max={100}
            value={defaultCommissionRate}
            onValueChange={setDefaultCommissionRate}
          />
        </Field>

        <div>
          <p id="business-service-areas" className="block text-sm font-medium text-foreground mb-2">
            Service Areas
          </p>
          <div
            role="group"
            aria-labelledby="business-service-areas"
            className="flex flex-wrap gap-2"
          >
            {serviceAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
                aria-pressed={serviceAreas.includes(area)}
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
          <p
            id="business-property-types"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Property Types
          </p>
          <div
            role="group"
            aria-labelledby="business-property-types"
            className="flex flex-wrap gap-2"
          >
            {propertyTypeOptions.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={propertyTypes.includes(type.value)}
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
        className="mt-6"
        isLoading={save.isPending}
        onClick={() => save.mutate()}
      >
        Save Preferences
      </Button>
    </div>
  );
};
