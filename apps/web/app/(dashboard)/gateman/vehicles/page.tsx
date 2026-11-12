'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, LogOut as ExitIcon } from '@sureground/icons';
import { NotAssignedToEstate } from '@/components/gateman/NotAssignedToEstate';
import {
  Alert,
  Button,
  Card,
  CardSkeleton,
  DocumentUpload,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  Select,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { WatchlistWarning } from '@/components/gateman/WatchlistWarning';
import { estateKeys } from '@/lib/queryKeys';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { cn } from '@sureground/shared';

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
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Car className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{estate.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Log a vehicle entering the estate.</p>
      </div>

      <Card className="p-6 space-y-4">
        <Field label="Plate number">
          <Input
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            placeholder="ABC123XY"
            inputClassName="text-center text-xl tracking-[0.15em] font-bold uppercase"
          />
        </Field>

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

        <Field label="Photo" optionalLabel="(optional)">
          <DocumentUpload
            value={photo ? [{ id: 'photo', file: photo }] : []}
            onChange={(items) => setPhoto(items[0]?.file ?? null)}
            accept="image/*"
            multiple={false}
            label=""
          />
        </Field>

        <Button
          variant="primary"
          fullWidth
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
      </Card>

      <section
        aria-labelledby="vehicles-inside-title"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id="vehicles-inside-title" className="text-base font-semibold text-foreground">
              Currently inside
            </h2>
            {!isInsideLoading && (
              <span
                className={cn(
                  'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  inside.length > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                )}
                aria-label={`${inside.length} inside`}
              >
                {inside.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Vehicles logged in at this estate that have not been marked as exited.
          </p>
        </header>
        {isInsideLoading ? (
          <div className="p-5">
            <ListSkeleton rows={2} />
          </div>
        ) : inside.length === 0 ? (
          <EmptyState
            bare
            icon={Car}
            title="No vehicles inside"
            description="Vehicles you log appear here with the time they came in. Mark them as exited when they leave."
          />
        ) : (
          <ul className="divide-y divide-border">
            {inside.map((log) => (
              <li
                key={log.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"
                  >
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium tracking-wide text-foreground">
                      {log.plateNumber}
                    </p>
                    {(log.vehicleDescription || log.driverName) && (
                      <p className="truncate text-xs text-muted-foreground">
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
      </section>
    </div>
  );
}
