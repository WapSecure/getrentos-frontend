'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal } from '@sureground/icons';
import { Card, CurrencyInput, Field, SaveButton, useToast } from '@sureground/ui';
import { bandsFromInputs, withStepUpSummary } from '@sureground/shared';
import { mine, type ManagementMandateDto } from '@/services/mandateService';
import { spendApprovalService } from '@/services/spendApprovalService';
import { unwrap } from '@/lib/apiHelpers';
import { investorKeys } from '@/lib/queryKeys';

const BAND_FIELDS = [
  {
    key: 'routine',
    label: 'Routine',
    hint: 'Your manager spends up to this without asking you.',
  },
  {
    key: 'emergency',
    label: 'Emergency',
    hint: 'Urgent repairs up to this go ahead first, and you are told straight away.',
  },
  {
    key: 'explicit',
    label: 'Explicit authorisation',
    hint: 'Above this, you confirm it is you before approving.',
  },
] as const;

type BandKey = (typeof BAND_FIELDS)[number]['key'];

// Shown only with a live engagement: the limits mean nothing without a manager to measure against.
export function SpendCapSettings() {
  const { data } = useQuery({
    queryKey: ['mandates', 'mine'],
    queryFn: () => unwrap(mine()),
  });
  const engagements = (data ?? []).filter((m) => m.status === 'ACTIVE');

  if (engagements.length === 0) return null;

  return (
    <Card className="mb-6 p-5">
      <div className="mb-1 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Spending limits</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Spend above the routine limit waits for your approval. Leave a limit blank for none. Saving
        asks you to confirm it is you.
      </p>
      <div className="divide-y divide-border">
        {engagements.map((m) => (
          <BandsRow key={m.id} mandate={m} />
        ))}
      </div>
    </Card>
  );
}

function BandsRow({ mandate }: { mandate: ManagementMandateDto }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const title = mandate.propertyTitle ?? 'Property';
  // Until the API sends bands, the old single cap is the routine limit.
  const [values, setValues] = useState<Record<BandKey, number>>({
    routine: mandate.bands?.routineCap ?? mandate.maintenanceApprovalCap ?? 0,
    emergency: mandate.bands?.emergencyCap ?? 0,
    explicit: mandate.bands?.explicitAbove ?? 0,
  });
  const { bands, error } = bandsFromInputs(values);

  const save = async () => {
    if (error) return false;
    const res = await withStepUpSummary(`Change the spending limits for ${title}`, () =>
      spendApprovalService.setMandateBands(mandate.id, bands)
    );
    if (!res.success) {
      toast.error(res.message || 'Could not save the limits.');
      return false;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mandates', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: investorKeys.managed }),
    ]);
    return true;
  };

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <p className="mb-3 truncate text-sm font-medium text-foreground">{title}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {BAND_FIELDS.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            hint={field.hint}
            htmlFor={`band-${mandate.id}-${field.key}`}
            error={error?.field === field.key ? error.message : undefined}
          >
            <CurrencyInput
              id={`band-${mandate.id}-${field.key}`}
              prefix="₦"
              value={values[field.key]}
              onValueChange={(v) => setValues((current) => ({ ...current, [field.key]: v }))}
              placeholder="No limit"
            />
          </Field>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <SaveButton
          label="Save limits"
          variant="secondary"
          size="sm"
          disabled={Boolean(error)}
          onClick={save}
          aria-label={`Save spending limits for ${title}`}
        />
      </div>
    </div>
  );
}
