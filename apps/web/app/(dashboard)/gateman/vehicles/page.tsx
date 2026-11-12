'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, LogOut as ExitIcon } from '@sureground/icons';
import { NotAssignedToEstate } from '@/components/gateman/NotAssignedToEstate';
import {
  Alert,
  Button,
  CardSkeleton,
  DocumentUpload,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageHeader,
  Select,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { WatchlistWarning } from '@/components/gateman/WatchlistWarning';
import { GateRowIcon, GateSection } from '@/components/gateman/GateSection';
import { estateKeys } from '@/lib/queryKeys';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';

const purposeOptions = [
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'OTHER', label: 'Other' },
];

const purposeLabel = (purpose: string) =>
  purposeOptions.find((option) => option.value === purpose.toUpperCase())?.label ?? 'Other';

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default function GatemanVehiclesPage() {
  const queryClient = useQueryClient();
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  const [driverName, setDriverName] = useState('');
  const [purpose, setPurpose] = useState('VISITOR');
  // `null` follows the console's post; `''` is an explicit "Not specified" and must not be overwritten.
  const [gateId, setGateId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<WatchlistRefusal | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const { estate, gate, isLoading: isEstateLoading } = useGatemanPost();
  const effectiveGateId = gateId ?? gate?.id ?? '';

  const { data: gates } = useQuery({
    queryKey: estateKeys.gates(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listGates(estate!.id)),
    enabled: !!estate,
  });
  const gateOptions = (gates ?? []).map((gate) => ({ value: gate.id, label: gate.name }));

  const { data: insideData, isLoading: isInsideLoading } = useQuery({
    queryKey: estateKeys.vehicleLogs(estate?.id ?? '', 'open'),
    queryFn: () =>
      unwrap(estateService.listVehicleLogs(estate!.id, { open: true, page: 1, pageSize: 100 })),
    enabled: !!estate,
  });
  const inside = insideData?.items ?? [];

  const logEntry = useMutation({
    mutationFn: ({ overrideReason }: { overrideReason?: string } = {}) =>
      unwrap(
        estateService.logVehicleEntry(estate!.id, {
          plateNumber: plateNumber.trim().toUpperCase(),
          vehicleDescription: vehicleDescription.trim() || undefined,
          driverName: driverName.trim() || undefined,
          purpose: purpose as 'VISITOR' | 'RESIDENT' | 'DELIVERY' | 'STAFF' | 'OTHER',
          gateId: effectiveGateId || undefined,
          overrideReason,
          photo: photo ?? undefined,
        })
      ),
    onSuccess: (log) => {
      setPlateNumber('');
      setVehicleDescription('');
      setDriverName('');
      setPurpose('VISITOR');
      setGateId(null);
      setPhoto(null);
      setError(null);
      setRefusal(null);
      setOverrideError(null);
      setWarning(log.watchlistWarning ?? null);
      queryClient.invalidateQueries({ queryKey: ['estate', estate?.id, 'vehicleLogs'] });
    },
    onError: (err, input) => {
      const blocked = readWatchlistRefusal(err);
      if (blocked) {
        setError(null);
        setOverrideError(null);
        setRefusal(blocked);
        return;
      }
      const message = err instanceof Error ? err.message : 'Unable to log this vehicle.';
      if (input?.overrideReason) {
        setOverrideError(message);
        return;
      }
      setError(message);
    },
  });

  const markExited = useMutation({
    mutationFn: (logId: string) => unwrap(estateService.markVehicleExited(estate!.id, logId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate', estate?.id, 'vehicleLogs'] });
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) {
    return <NotAssignedToEstate icon={Car} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title={estate.name} description="Log a vehicle entering the estate." />

      <section
        aria-labelledby="log-vehicle-title"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <header className="border-b border-border px-5 py-4">
          <h2 id="log-vehicle-title" className="text-base font-semibold text-foreground">
            Log a vehicle
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Only the plate is needed. Add the rest if you have time.
          </p>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <Field label="Plate number">
            <Input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="ABC123XY"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="min-h-16 rounded-lg border-2 border-foreground/60 px-4 sm:min-h-16"
              leadingIcon={<PlateBolt />}
              trailingIcon={<PlateBolt />}
              inputClassName="pl-[0.2em] text-center font-mono text-2xl font-bold uppercase tracking-[0.2em] placeholder:text-muted-foreground/40"
            />
          </Field>

          <fieldset>
            <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vehicle and driver
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Description" optionalLabel="(optional)">
                <Input
                  type="text"
                  value={vehicleDescription}
                  onChange={(e) => setVehicleDescription(e.target.value)}
                  placeholder="e.g. Black Camry"
                />
              </Field>
              <Field label="Driver" optionalLabel="(optional)">
                <Input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Tunde"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Visit
            </legend>
            <div
              className={`grid grid-cols-1 gap-3 ${gateOptions.length > 0 ? 'sm:grid-cols-2' : ''}`}
            >
              <Field label="Purpose">
                <Select value={purpose} onValueChange={setPurpose} options={purposeOptions} />
              </Field>
              {gateOptions.length > 0 && (
                <Field label="Gate">
                  <Select
                    value={effectiveGateId}
                    onValueChange={setGateId}
                    options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
                  />
                </Field>
              )}
            </div>
          </fieldset>

          <Field label="Photo" optionalLabel="(optional)">
            <DocumentUpload
              value={photo ? [{ id: 'photo', file: photo }] : []}
              onChange={(items) => setPhoto(items[0]?.file ?? null)}
              accept="image/*"
              multiple={false}
              label=""
            />
          </Field>

          {refusal && (
            <WatchlistBlockedNotice
              message={refusal.message}
              matches={refusal.matches}
              onOverride={(reason) => logEntry.mutate({ overrideReason: reason })}
              onDefer={() => {
                setRefusal(null);
                setOverrideError(null);
                setPlateNumber('');
              }}
              isOverriding={logEntry.isPending}
              error={overrideError}
            />
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          <WatchlistWarning warning={warning ?? undefined} />
        </div>

        <div className="border-t border-border bg-secondary/40 px-5 py-4 sm:px-6">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            icon={<Car className="h-4 w-4" />}
            disabled={!plateNumber.trim()}
            isLoading={logEntry.isPending}
            loadingText="Logging…"
            onClick={() => {
              setError(null);
              setRefusal(null);
              setOverrideError(null);
              setWarning(null);
              logEntry.mutate({});
            }}
          >
            Log vehicle
          </Button>
        </div>
      </section>

      <GateSection
        id="vehicles-inside"
        title="Currently inside"
        count={isInsideLoading ? undefined : inside.length}
        countLabel={`${inside.length} inside`}
        description="Vehicles logged in at this estate that have not been marked as exited."
      >
        {isInsideLoading ? (
          <div className="p-5">
            <ListSkeleton rows={2} />
          </div>
        ) : inside.length === 0 ? (
          <EmptyState
            bare
            size="compact"
            icon={Car}
            title="No vehicles inside"
            description="When you log a vehicle, it appears here until you mark it as exited."
          />
        ) : (
          <ul className="divide-y divide-border">
            {inside.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <GateRowIcon>
                    <Car />
                  </GateRowIcon>
                  <div className="min-w-0">
                    <p className="inline-flex max-w-full rounded-md border border-foreground/40 px-2 py-0.5 font-mono text-sm font-bold tracking-[0.12em] text-foreground">
                      <span className="truncate">{log.plateNumber}</span>
                    </p>
                    {(log.vehicleDescription || log.driverName) && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {[
                          log.vehicleDescription,
                          log.driverName ? `Driver: ${log.driverName}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {purposeLabel(log.purpose)} · entered {formatTime(log.enteredAt)}
                      {log.gateName ? ` · ${log.gateName}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="shrink-0"
                  icon={<ExitIcon className="w-3.5 h-3.5" />}
                  disabled={markExited.isPending}
                  isLoading={markExited.isPending && markExited.variables === log.id}
                  aria-label={`Mark ${log.plateNumber} as exited`}
                  onClick={() => markExited.mutate(log.id)}
                >
                  Exit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GateSection>
    </div>
  );
}

/** Decorative bolt heads, so the plate field reads as a number plate. */
const PlateBolt = () => (
  <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-foreground/25" />
);
