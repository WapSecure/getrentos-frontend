'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  WATER_TEST_RESULT_LABELS,
  WATER_UTILITY_KINDS,
  type WaterTestResult,
} from '@sureground/shared';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type HomeManagementProperty,
} from '@/services/homeManagementService';
import { utilitiesService } from '@/services/utilitiesService';
import { dayToInstant, lagosToday, optionalText, propertyName } from './utilityForm';

interface WaterTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: HomeManagementProperty[];
  defaultPropertyId?: string;
}

/** The readings most labs report; anything else goes in the note. */
const READINGS = [
  { key: 'pH', label: 'pH', placeholder: 'e.g. 7.1' },
  { key: 'tdsMgL', label: 'Dissolved solids (mg/L)', placeholder: 'e.g. 180' },
  { key: 'ironMgL', label: 'Iron (mg/L)', placeholder: 'e.g. 0.2' },
  { key: 'coliforms', label: 'Coliforms', placeholder: 'e.g. Absent' },
] as const;

export function WaterTestDialog({
  open,
  onOpenChange,
  properties,
  defaultPropertyId,
}: WaterTestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <WaterTestForm
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function WaterTestForm({
  properties,
  defaultPropertyId,
  onDone,
}: Omit<WaterTestDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId || (properties.length === 1 ? properties[0].id : '')
  );
  const [assetId, setAssetId] = useState('');
  const [sampledOn, setSampledOn] = useState(lagosToday());
  const [labName, setLabName] = useState('');
  const [result, setResult] = useState<WaterTestResult>('PASS');
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [cost, setCost] = useState(0);
  const [note, setNote] = useState('');
  const [shared, setShared] = useState(false);
  const [report, setReport] = useState<File | null>(null);
  const assets = useQuery({
    queryKey: [...homeManagementKeys.assets(propertyId), 'water'],
    queryFn: async () => {
      const pages = await Promise.all(
        WATER_UTILITY_KINDS.map((utilityKind) =>
          unwrap(homeManagementService.listAssets({ propertyId, utilityKind, pageSize: 50 }))
        )
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: !!propertyId,
  });
  const canSubmit = !!propertyId && labName.trim().length >= 2;

  const save = useMutation({
    mutationFn: async () => {
      const parameters: Record<string, string | number> = {};
      for (const { key } of READINGS) {
        const raw = readings[key]?.trim();
        if (!raw) continue;
        const asNumber = Number(raw);
        parameters[key] = raw !== '' && Number.isFinite(asNumber) ? asNumber : raw;
      }
      const test = await unwrap(
        utilitiesService.createWaterTest({
          propertyId,
          assetId: assetId || undefined,
          sampledAt: dayToInstant(sampledOn),
          labName: labName.trim(),
          result,
          parameters: Object.keys(parameters).length ? parameters : undefined,
          cost: cost > 0 ? cost : undefined,
          note: optionalText(note),
          sharedWithResidents: shared,
        })
      );
      if (report) {
        try {
          await unwrap(utilitiesService.addWaterTestDocument(test.id, report));
        } catch {
          toast.error('Saved, but the lab report did not upload.');
        }
      }
      return test;
    },
    onSuccess: (test) => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.timeline() });
      toast.success(
        test.result === 'FAIL'
          ? 'Failed test recorded. The owner and agency have been told.'
          : 'Water test recorded.'
      );
      onDone();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) save.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Record a water test
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Enter the lab&apos;s result and attach its report. A failed test tells the owner and the
        managing agency.
      </DialogDescription>
      <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Property" required>
            <Select
              ariaLabel="Property"
              value={propertyId}
              onValueChange={(value) => {
                setPropertyId(value);
                setAssetId('');
              }}
              placeholder="Select a property"
              options={properties.map((property) => ({
                value: property.id,
                label: propertyName(property),
              }))}
            />
          </Field>
          <Field label="Sample from" hint="Optional">
            <Select
              ariaLabel="Borehole, tank or treatment unit"
              value={assetId}
              disabled={!propertyId}
              onValueChange={setAssetId}
              options={[
                { value: '', label: 'Not recorded' },
                ...(assets.data ?? []).map((asset) => ({ value: asset.id, label: asset.name })),
              ]}
            />
          </Field>
          <Field label="Sampled on" required>
            <DatePicker
              value={sampledOn}
              onChange={setSampledOn}
              max={lagosToday()}
              ariaLabel="Sampled on"
            />
          </Field>
          <Field label="Laboratory" required>
            <Input value={labName} onChange={(event) => setLabName(event.target.value)} />
          </Field>
          <Field label="Result" required>
            <SegmentedControl
              aria-label="Result"
              value={result}
              onValueChange={setResult}
              segments={(Object.keys(WATER_TEST_RESULT_LABELS) as WaterTestResult[]).map(
                (value) => ({
                  value,
                  label: WATER_TEST_RESULT_LABELS[value],
                })
              )}
            />
          </Field>
          <Field label="Lab fee" hint="Optional, whole naira">
            <CurrencyInput value={cost || ''} onValueChange={setCost} placeholder="0" />
          </Field>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {READINGS.map((reading) => (
              <Field key={reading.key} label={reading.label}>
                <Input
                  value={readings[reading.key] ?? ''}
                  placeholder={reading.placeholder}
                  onChange={(event) =>
                    setReadings((current) => ({ ...current, [reading.key]: event.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
          <Field label="Note">
            <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Field label="Lab report" hint="A photo or PDF, up to 25MB">
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setReport(event.target.files?.[0] ?? null)}
            />
          </Field>
          <Switch
            checked={shared}
            onCheckedChange={setShared}
            label="Share the result with residents"
            description="Off by default. The lab report itself is never shared."
          />
        </div>
      </div>
      {result === 'FAIL' && (
        <Alert variant="warning" className="mt-5">
          After saving, consider raising a borehole and water work order and booking a retest.
        </Alert>
      )}
      {save.error && (
        <Alert variant="danger" className="mt-5">
          {save.error.message || 'The test could not be saved.'}
        </Alert>
      )}
      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
        <Button type="button" variant="outline" rounded="md" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" rounded="md" isLoading={save.isPending} disabled={!canSubmit}>
          Save test
        </Button>
      </div>
    </form>
  );
}
