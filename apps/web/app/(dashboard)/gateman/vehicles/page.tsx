'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, LogOut as ExitIcon } from 'lucide-react';
import { Button, DocumentUpload, LegacyInput, Select } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { readWatchlistRefusal, type WatchlistRefusal } from '@/lib/gateman/watchlistRefusal';
import { WatchlistBlockedNotice } from '@/components/gateman/WatchlistBlockedNotice';
import { WatchlistWarning } from '@/components/gateman/WatchlistWarning';
import { estateKeys } from '@/lib/queryKeys';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';

const purposeOptions = [
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'OTHER', label: 'Other' },
];

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default function GatemanVehiclesPage() {
  const queryClient = useQueryClient();
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  const [driverName, setDriverName] = useState('');
  const [purpose, setPurpose] = useState('VISITOR');
  /**
   * `null` means the guard has not touched the gate field, so it follows the
   * console's post. An explicit `''` means they chose "Not specified" for this
   * vehicle, which is a real answer and must not be overwritten.
   */
  const [gateId, setGateId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  /**
   * Set when the estate's watch list refused this vehicle.
   *
   * Kept apart from `error` on purpose: a blocked registration is the estate's
   * answer, and the guard needs the plate and the reason in front of them to
   * decide whether they are looking at the car the estate meant.
   */
  const [refusal, setRefusal] = useState<WatchlistRefusal | null>(null);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  /**
   * The estate's note about a vehicle it matched but did not refuse.
   *
   * The log went through, on purpose. A guard who reads this as a problem starts
   * second-guessing an entry the estate already decided to allow.
   */
  const [warning, setWarning] = useState<string | null>(null);

  const { estate, gate, isLoading: isEstateLoading } = useGatemanPost();
  const effectiveGateId = gateId ?? gate?.id ?? '';

  const { data: gates } = useQuery({
    queryKey: estateKeys.gates(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listGates(estate!.id)),
    enabled: !!estate,
  });
  const gateOptions = (gates ?? []).map((gate) => ({ value: gate.id, label: gate.name }));

  const { data: insideData } = useQuery({
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
      // Back to following the console's post, so the next vehicle does not have
      // to re-pick the barrier the guard is still standing at.
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
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You&apos;re not assigned to an estate yet.</p>
      </div>
    );
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

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Plate number</label>
          <LegacyInput
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            placeholder="ABC123XY"
            className="text-center text-xl tracking-[0.15em] font-bold uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <LegacyInput
              type="text"
              value={vehicleDescription}
              onChange={(e) => setVehicleDescription(e.target.value)}
              placeholder="e.g. Black Camry"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Driver <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <LegacyInput
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. Tunde"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Purpose</label>
          <Select value={purpose} onValueChange={setPurpose} options={purposeOptions} />
        </div>

        {gateOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Gate</label>
            <Select
              value={effectiveGateId}
              onValueChange={setGateId}
              options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Photo <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <DocumentUpload
            value={photo ? [{ id: 'photo', file: photo }] : []}
            onChange={(items) => setPhoto(items[0]?.file ?? null)}
            accept="image/*"
            multiple={false}
            label=""
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={!plateNumber.trim() || logEntry.isPending}
          onClick={() => {
            setError(null);
            setRefusal(null);
            setOverrideError(null);
            setWarning(null);
            logEntry.mutate({});
          }}
        >
          {logEntry.isPending ? 'Logging…' : 'Log Vehicle'}
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <WatchlistWarning warning={warning ?? undefined} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Currently Inside ({inside.length})
        </h2>
        {inside.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicles currently logged inside.</p>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {inside.map((log) => (
              <div key={log.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{log.plateNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {log.vehicleDescription || log.purpose} · entered {formatTime(log.enteredAt)}
                    {log.gateName ? ` · ${log.gateName}` : ''}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={markExited.isPending}
                  onClick={() => markExited.mutate(log.id)}
                >
                  <ExitIcon className="w-3.5 h-3.5" />
                  Exit
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
