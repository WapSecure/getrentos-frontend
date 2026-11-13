'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from '@sureground/icons';
import {
  DISCO_LABELS,
  ELECTRICITY_DISCOS,
  METER_SCOPE_LABELS,
  METER_TYPE_LABELS,
  TARIFF_BANDS,
  TARIFF_BAND_LABELS,
  bandCheck,
  isPlausibleMeterNumber,
  maskMeterNumber,
  type ElectricityDisco,
  type ElectricityMeter,
  type MeterScope,
  type MeterType,
  type TariffBand,
} from '@sureground/shared';
import {
  Alert,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Select,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type HomeManagementProperty,
} from '@/services/homeManagementService';
import { utilitiesService } from '@/services/utilitiesService';
import { lagosToday, optionalText, propertyName } from './utilityForm';

interface MeterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: HomeManagementProperty[];
  defaultPropertyId?: string;
}

/** Add an electricity meter. The number is stored sealed; everyone sees only its last 4 digits. */
export function MeterDialog({
  open,
  onOpenChange,
  properties,
  defaultPropertyId,
}: MeterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <MeterForm
          properties={properties}
          defaultPropertyId={defaultPropertyId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function MeterForm({
  properties,
  defaultPropertyId,
  onDone,
}: Omit<MeterDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId || (properties.length === 1 ? properties[0].id : '')
  );
  const [scope, setScope] = useState<MeterScope>('UNIT');
  const [unitId, setUnitId] = useState('');
  const [disco, setDisco] = useState<ElectricityDisco>('IKEJA');
  const [discoOther, setDiscoOther] = useState('');
  const [band, setBand] = useState<TariffBand | ''>('');
  const [meterType, setMeterType] = useState<MeterType>('PREPAID');
  const [meterNumber, setMeterNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [label, setLabel] = useState('');
  const units = useQuery({
    queryKey: homeManagementKeys.units(propertyId),
    queryFn: () => unwrap(homeManagementService.listUnits(propertyId)),
    enabled: !!propertyId && scope === 'UNIT',
  });
  const numberInvalid = meterNumber.trim() !== '' && !isPlausibleMeterNumber(meterNumber);
  const canSubmit =
    !!propertyId &&
    (scope !== 'UNIT' || !!unitId) &&
    (disco !== 'OTHER' || !!discoOther.trim()) &&
    !numberInvalid;

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        utilitiesService.createMeter({
          propertyId,
          scope,
          unitId: scope === 'UNIT' ? unitId : undefined,
          disco,
          discoOther: disco === 'OTHER' ? discoOther.trim() : undefined,
          tariffBand: band || undefined,
          meterType,
          meterNumber: meterType === 'UNMETERED' ? undefined : optionalText(meterNumber),
          accountNumber: meterType === 'PREPAID' ? undefined : optionalText(accountNumber),
          label: optionalText(label),
        })
      ),
    onSuccess: () => {
      setMeterNumber('');
      setAccountNumber('');
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success('Meter added.');
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
        Add a meter
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Numbers are stored securely. Field agents and lists only ever see the last 4 digits.
      </DialogDescription>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Property" required>
          <Select
            ariaLabel="Property"
            value={propertyId}
            onValueChange={(value) => {
              setPropertyId(value);
              setUnitId('');
            }}
            placeholder="Select a property"
            options={properties.map((property) => ({
              value: property.id,
              label: propertyName(property),
            }))}
          />
        </Field>
        <Field label="Supplies" required>
          <Select
            ariaLabel="What the meter supplies"
            value={scope}
            onValueChange={(value) => setScope(value as MeterScope)}
            options={(Object.keys(METER_SCOPE_LABELS) as MeterScope[]).map((value) => ({
              value,
              label: METER_SCOPE_LABELS[value],
            }))}
          />
        </Field>
        {scope === 'UNIT' && (
          <Field label="Unit" required>
            <Select
              ariaLabel="Unit"
              value={unitId}
              disabled={!propertyId}
              onValueChange={setUnitId}
              placeholder={propertyId ? 'Select a unit' : 'Choose a property first'}
              options={(units.data ?? []).map((unit) => ({ value: unit.id, label: unit.unitName }))}
            />
          </Field>
        )}
        <Field label="Electricity company" required>
          <Select
            ariaLabel="Electricity company"
            searchable
            value={disco}
            onValueChange={(value) => setDisco(value as ElectricityDisco)}
            options={ELECTRICITY_DISCOS.map((value) => ({ value, label: DISCO_LABELS[value] }))}
          />
        </Field>
        {disco === 'OTHER' && (
          <Field label="Company name" required>
            <Input value={discoOther} onChange={(event) => setDiscoOther(event.target.value)} />
          </Field>
        )}
        <Field label="Tariff band" hint="On the bill or the vending receipt">
          <Select
            ariaLabel="Tariff band"
            value={band}
            onValueChange={(value) => setBand(value as TariffBand | '')}
            options={[
              { value: '', label: 'Not known' },
              ...TARIFF_BANDS.map((value) => ({ value, label: TARIFF_BAND_LABELS[value] })),
            ]}
          />
        </Field>
        <Field label="Meter type" required>
          <Select
            ariaLabel="Meter type"
            value={meterType}
            onValueChange={(value) => setMeterType(value as MeterType)}
            options={(Object.keys(METER_TYPE_LABELS) as MeterType[]).map((value) => ({
              value,
              label: METER_TYPE_LABELS[value],
            }))}
          />
        </Field>
        {meterType !== 'UNMETERED' && (
          <Field
            label="Meter number"
            hint="11 to 13 digits"
            error={numberInvalid ? 'A meter number is 11 to 13 digits.' : undefined}
          >
            <Input
              inputMode="numeric"
              autoComplete="off"
              value={meterNumber}
              onChange={(event) => setMeterNumber(event.target.value.replace(/[^\d\s-]/g, ''))}
            />
          </Field>
        )}
        {meterType !== 'PREPAID' && (
          <Field label="Account number" hint="From the bill">
            <Input
              inputMode="numeric"
              autoComplete="off"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value.replace(/[^\d\s-]/g, ''))}
            />
          </Field>
        )}
        <Field label="Label" hint="Optional, for example Borehole pump or Flat 2">
          <Input value={label} onChange={(event) => setLabel(event.target.value)} />
        </Field>
      </div>
      {save.error && (
        <Alert variant="danger" className="mt-5">
          {save.error.message || 'The meter could not be added.'}
        </Alert>
      )}
      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
        <Button type="button" variant="outline" rounded="md" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" rounded="md" isLoading={save.isPending} disabled={!canSubmit}>
          Add meter
        </Button>
      </div>
    </form>
  );
}

/** Shows the full number for one meter after an audited request; hidden again on a second press. */
export function MeterRevealButton({ meter }: { meter: ElectricityMeter }) {
  const toast = useToast();
  const [revealed, setRevealed] = useState<string | null>(null);
  const reveal = useMutation({
    mutationFn: () => unwrap(utilitiesService.revealMeter(meter.id)),
    onSuccess: (result) =>
      setRevealed(
        [result.meterNumber, result.accountNumber && `Account ${result.accountNumber}`]
          .filter(Boolean)
          .join(', ') || 'No number recorded'
      ),
    onError: (error: Error) => toast.error(error.message || 'The number could not be shown.'),
  });
  if (!meter.hasMeterNumber && !meter.hasAccountNumber) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {revealed && <span className="font-mono text-sm text-foreground">{revealed}</span>}
      <IconButton
        size="sm"
        variant="ghost"
        label={
          revealed ? 'Hide the full number' : 'Show the full number (recorded in the audit trail)'
        }
        icon={revealed ? <EyeOff /> : <Eye />}
        isLoading={reveal.isPending}
        onClick={() => (revealed ? setRevealed(null) : reveal.mutate())}
      />
    </span>
  );
}

/** Log a day's grid supply and see the last 30 days against the band. */
export function SupplyHoursDialog({
  meter,
  onOpenChange,
}: {
  meter: ElectricityMeter | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!meter} onOpenChange={onOpenChange}>
      <DialogContent size="xl">{meter && <SupplyHoursForm meter={meter} />}</DialogContent>
    </Dialog>
  );
}

function SupplyHoursForm({ meter }: { meter: ElectricityMeter }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [day, setDay] = useState(lagosToday());
  const [hours, setHours] = useState('');
  const history = useQuery({
    queryKey: homeManagementKeys.utilities.supplyHours(meter.id),
    queryFn: () => unwrap(utilitiesService.supplyHours(meter.id)),
  });
  const value = hours === '' ? undefined : Number(hours);
  const valid = value !== undefined && Number.isFinite(value) && value >= 0 && value <= 24;
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        utilitiesService.logSupplyHours(meter.id, {
          day,
          hoursSupplied: Math.round((value ?? 0) * 10) / 10,
        })
      ),
    onSuccess: () => {
      setHours('');
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success('Supply logged.');
    },
  });
  const check = bandCheck(history.data?.averageHours, meter.tariffBand);
  const name = meter.label || meter.unit?.name || maskMeterNumber(meter.meterNumberLast4);

  return (
    <div>
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Grid supply: {name}
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Log how many hours of grid power the meter had each day. Days not logged are left out of the
        average.
      </DialogDescription>
      <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <Field label="Day" required>
            <DatePicker value={day} onChange={setDay} max={lagosToday()} ariaLabel="Day" />
          </Field>
          <Field label="Hours of supply" required hint="0 to 24, to one decimal place">
            <Input
              inputMode="decimal"
              value={hours}
              onChange={(event) => setHours(event.target.value.replace(/[^\d.]/g, ''))}
              placeholder="e.g. 14.5"
            />
          </Field>
          {save.error && <Alert variant="danger">{save.error.message}</Alert>}
          <Button type="submit" rounded="md" isLoading={save.isPending} disabled={!valid}>
            Log supply
          </Button>
        </form>
        <div>
          <p className="text-sm font-medium text-foreground">Last 30 days</p>
          <p
            className={
              check.status === 'BELOW'
                ? 'mt-1 text-sm text-warning'
                : 'mt-1 text-sm text-muted-foreground'
            }
          >
            {check.message}
            {history.data && history.data.daysLogged > 0
              ? ` (${history.data.daysLogged} ${history.data.daysLogged === 1 ? 'day' : 'days'} logged)`
              : ''}
          </p>
          {history.data?.days.length ? (
            <ul className="mt-3 max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border text-sm">
              {[...history.data.days].reverse().map((entry) => (
                <li key={entry.day} className="flex justify-between px-3 py-2">
                  <span>{formatDate(`${entry.day}T12:00:00+01:00`)}</span>
                  <span className="font-medium">{entry.hoursSupplied} hours</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
