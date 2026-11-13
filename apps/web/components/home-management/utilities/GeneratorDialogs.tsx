'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FUEL_TYPE_LABELS,
  generatorServiceLabel,
  type FuelType,
  type UtilityGenerator,
} from '@sureground/shared';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import { homeManagementService } from '@/services/homeManagementService';
import { utilitiesService } from '@/services/utilitiesService';
import { dayToInstant, lagosToday, optionalPositiveNumber, optionalText } from './utilityForm';

interface GeneratorDialogProps {
  generator: UtilityGenerator | null;
  onOpenChange: (open: boolean) => void;
}

const FormActions = ({
  onCancel,
  pending,
  disabled,
  label,
}: {
  onCancel: () => void;
  pending: boolean;
  disabled: boolean;
  label: string;
}) => (
  <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
    <Button type="button" variant="outline" rounded="md" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" rounded="md" isLoading={pending} disabled={disabled}>
      {label}
    </Button>
  </div>
);

/** Log the number on the hour meter. A lower number is refused unless the meter was reset. */
export function HourReadingDialog({ generator, onOpenChange }: GeneratorDialogProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [day, setDay] = useState(lagosToday());
  const [hourMeter, setHourMeter] = useState('');
  const [meterReset, setMeterReset] = useState(false);
  const [note, setNote] = useState('');
  const latest = generator?.service.latestReading;
  const readings = useQuery({
    queryKey: homeManagementKeys.utilities.readings(generator?.id ?? 'none'),
    queryFn: () => unwrap(utilitiesService.listReadings(generator!.id, 1, 5)),
    enabled: !!generator,
  });
  const value = optionalPositiveNumber(hourMeter);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        utilitiesService.recordReading(generator!.id, {
          readAt: dayToInstant(day),
          hourMeter: value ?? 0,
          meterReset: meterReset || undefined,
          note: optionalText(note),
        })
      ),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success(`Hours logged. ${generatorServiceLabel(result.service)}.`);
      close();
    },
  });

  const close = () => {
    setHourMeter('');
    setMeterReset(false);
    setNote('');
    save.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={!!generator} onOpenChange={(open) => (open ? onOpenChange(true) : close())}>
      <DialogContent size="lg">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (value !== undefined || hourMeter === '0') save.mutate();
          }}
        >
          <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
            Log hours: {generator?.name}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {latest
              ? `Last reading ${latest.hourMeter} hours on ${formatDate(latest.readAt)}.`
              : 'This is the first reading for this generator.'}
          </DialogDescription>
          <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-4">
              <Field label="Hour meter" required hint="The number shown on the generator, in hours">
                <Input
                  inputMode="decimal"
                  autoFocus
                  value={hourMeter}
                  onChange={(event) => setHourMeter(event.target.value.replace(/[^\d.]/g, ''))}
                  placeholder={latest ? String(latest.hourMeter) : 'e.g. 1240.5'}
                />
              </Field>
              <Field label="Read on" required>
                <DatePicker value={day} onChange={setDay} max={lagosToday()} ariaLabel="Read on" />
              </Field>
              <Checkbox
                checked={meterReset}
                onCheckedChange={(checked) => setMeterReset(checked === true)}
                label="Meter was reset or replaced"
              />
              <Field label="Note">
                <Textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Recent readings</p>
              {readings.data?.items.length ? (
                <ul className="mt-2 divide-y divide-border rounded-xl border border-border text-sm">
                  {readings.data.items.map((reading) => (
                    <li
                      key={reading.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span
                        className={reading.voidedAt ? 'text-muted-foreground line-through' : ''}
                      >
                        {reading.hourMeter} hours
                        {reading.meterReset ? ' (reset)' : ''}
                      </span>
                      <span className="text-muted-foreground">{formatDate(reading.readAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No readings yet.</p>
              )}
            </div>
          </div>
          {save.error && (
            <Alert variant="danger" className="mt-5">
              {save.error.message || 'This reading could not be saved.'}
            </Alert>
          )}
          <FormActions
            onCancel={close}
            pending={save.isPending}
            disabled={value === undefined && hourMeter !== '0'}
            label="Log hours"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Rating, fuel and the service interval. Owner or agency only; the server refuses a field agent. */
export function GeneratorProfileDialog({ generator, onOpenChange }: GeneratorDialogProps) {
  return (
    <Dialog open={!!generator} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {generator && <ProfileForm generator={generator} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({ generator, onDone }: { generator: UtilityGenerator; onDone: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = generator.profile;
  const [ratedKva, setRatedKva] = useState(profile?.ratedKva?.toString() ?? '');
  const [fuelType, setFuelType] = useState<FuelType>(profile?.fuelType ?? 'DIESEL');
  const [tankLitres, setTankLitres] = useState(profile?.tankLitres?.toString() ?? '');
  const [hours, setHours] = useState(profile?.serviceIntervalHours?.toString() ?? '250');
  const [days, setDays] = useState(profile?.serviceIntervalDays?.toString() ?? '90');
  const [planId, setPlanId] = useState(profile?.preventivePlanId ?? '');
  const plans = useQuery({
    queryKey: [...homeManagementKeys.plans, { propertyId: generator.property.id, picker: true }],
    queryFn: () =>
      unwrap(homeManagementService.listPlans({ propertyId: generator.property.id, pageSize: 100 })),
  });
  const planOptions = (plans.data?.items ?? []).filter(
    (plan) => !plan.assetId || plan.assetId === generator.id
  );
  const whole = (value: string) => {
    const parsed = optionalPositiveNumber(value);
    return parsed === undefined ? undefined : Math.round(parsed);
  };

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        utilitiesService.saveGeneratorProfile(generator.id, {
          ratedKva: optionalPositiveNumber(ratedKva),
          fuelType,
          tankLitres: whole(tankLitres),
          serviceIntervalHours: whole(hours),
          serviceIntervalDays: whole(days),
          preventivePlanId: planId || undefined,
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      toast.success('Generator details saved.');
      onDone();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Generator details: {generator.name}
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Service is due after the running hours or the days below, whichever comes first.
      </DialogDescription>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Rating (kVA)">
          <Input
            inputMode="decimal"
            value={ratedKva}
            onChange={(event) => setRatedKva(event.target.value.replace(/[^\d.]/g, ''))}
            placeholder="e.g. 60"
          />
        </Field>
        <Field label="Fuel" required>
          <Select
            ariaLabel="Fuel"
            value={fuelType}
            onValueChange={(value) => setFuelType(value as FuelType)}
            options={(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((value) => ({
              value,
              label: FUEL_TYPE_LABELS[value],
            }))}
          />
        </Field>
        <Field label="Tank size (litres)">
          <Input
            inputMode="numeric"
            value={tankLitres}
            onChange={(event) => setTankLitres(event.target.value.replace(/\D/g, ''))}
          />
        </Field>
        <Field label="Service every (running hours)" hint="Often 250 hours for diesel sets">
          <Input
            inputMode="numeric"
            value={hours}
            onChange={(event) => setHours(event.target.value.replace(/\D/g, ''))}
          />
        </Field>
        <Field label="Or every (days)">
          <Input
            inputMode="numeric"
            value={days}
            onChange={(event) => setDays(event.target.value.replace(/\D/g, ''))}
          />
        </Field>
        <Field
          label="Care plan that raises the service job"
          hint="When the hours run out, the plan's work order is raised at the next morning run."
        >
          <Select
            ariaLabel="Care plan"
            value={planId}
            onValueChange={setPlanId}
            options={[
              { value: '', label: 'No care plan' },
              ...planOptions.map((plan) => ({ value: plan.id, label: plan.title })),
            ]}
          />
        </Field>
      </div>
      {save.error && (
        <Alert variant="danger" className="mt-5">
          {save.error.message || 'These details could not be saved.'}
        </Alert>
      )}
      <FormActions
        onCancel={onDone}
        pending={save.isPending}
        disabled={false}
        label="Save details"
      />
    </form>
  );
}

/** Record a service and restart the running-hours count. Owner or agency only. */
export function GeneratorServiceDialog({ generator, onOpenChange }: GeneratorDialogProps) {
  return (
    <Dialog open={!!generator} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {generator && <ServiceForm generator={generator} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({ generator, onDone }: { generator: UtilityGenerator; onDone: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [day, setDay] = useState(lagosToday());
  const [hourMeter, setHourMeter] = useState(
    generator.service.latestReading?.hourMeter.toString() ?? ''
  );
  const [note, setNote] = useState('');
  const save = useMutation({
    mutationFn: () =>
      unwrap(
        utilitiesService.recordService(generator.id, {
          servicedAt: dayToInstant(day),
          hourMeter: hourMeter === '' ? undefined : Number(hourMeter),
          note: optionalText(note),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.plans });
      toast.success('Service recorded. The running-hours count starts again.');
      onDone();
    },
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Record a service: {generator.name}
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        {generator.profile?.preventivePlanId
          ? 'Its care plan is marked done too, so no second job is raised.'
          : 'The next service is counted from here.'}
      </DialogDescription>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Serviced on" required>
          <DatePicker value={day} onChange={setDay} max={lagosToday()} ariaLabel="Serviced on" />
        </Field>
        <Field label="Hour meter at the service" hint="Leave blank to use the latest reading">
          <Input
            inputMode="decimal"
            value={hourMeter}
            onChange={(event) => setHourMeter(event.target.value.replace(/[^\d.]/g, ''))}
          />
        </Field>
        <Field label="Note" className="sm:col-span-2">
          <Textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Oil, oil filter and air filter changed"
          />
        </Field>
      </div>
      {save.error && (
        <Alert variant="danger" className="mt-5">
          {save.error.message || 'The service could not be recorded.'}
        </Alert>
      )}
      <FormActions
        onCancel={onDone}
        pending={save.isPending}
        disabled={false}
        label="Record service"
      />
    </form>
  );
}
