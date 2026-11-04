'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  Input,
  type BadgeVariant,
} from '@getrentos/ui';
import { Bed, Bath, UserPlus, DoorClosed, MoreVertical, ReceiptText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { rentSuffix } from '@/lib/leaseTerm';
import type { Unit, UnitOccupancyStatus } from '@/types/landlord';

const statusConfig: Record<UnitOccupancyStatus, { label: string; variant: BadgeVariant }> = {
  occupied: { label: 'Occupied', variant: 'success' },
  vacant: { label: 'Vacant', variant: 'warning' },
  notice_given: { label: 'Notice Given', variant: 'info' },
};

/** What a landlord knows about an occupier who will not use GetRentos themselves. */
export interface OccupierRecord {
  tenantName: string;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const todayIso = () => isoDate(new Date());
const oneYearAfter = (iso: string) => {
  const date = new Date(iso);
  date.setFullYear(date.getFullYear() + 1);
  return isoDate(date);
};

interface UnitsTableProps {
  units: Unit[];
  onMarkVacant: (unitId: string) => Promise<void>;
  onRecordOccupier: (unitId: string, record: OccupierRecord) => Promise<void>;
  onChargeUnit: (unit: Unit) => void;
  pendingUnitId?: string;
}

export const UnitsTable = ({
  units,
  onMarkVacant,
  onRecordOccupier,
  onChargeUnit,
  pendingUnitId,
}: UnitsTableProps) => {
  const [recordingUnit, setRecordingUnit] = useState<Unit | null>(null);
  const [occupierName, setOccupierName] = useState('');
  const [occupierRent, setOccupierRent] = useState('');
  const [occupierStart, setOccupierStart] = useState(todayIso());
  const [occupierEnd, setOccupierEnd] = useState(oneYearAfter(todayIso()));
  const [vacatingUnit, setVacatingUnit] = useState<Unit | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  const openRecorder = (unit: Unit) => {
    const start = todayIso();
    setRecordingUnit(unit);
    setOccupierName('');
    setOccupierRent(unit.askingRent !== undefined ? String(unit.askingRent) : '');
    setOccupierStart(start);
    setOccupierEnd(oneYearAfter(start));
    setRecordError(null);
  };

  const closeRecorder = () => {
    setRecordingUnit(null);
    setRecordError(null);
  };

  const handleRecordSubmit = async () => {
    if (!recordingUnit) return;
    const tenantName = occupierName.trim();
    const rentAmount = Number(occupierRent);
    if (!tenantName) return setRecordError('Enter the occupier’s name.');
    if (!Number.isFinite(rentAmount) || rentAmount <= 0)
      return setRecordError('Enter the rent you collect for this tenancy.');
    if (!occupierStart || !occupierEnd || occupierEnd <= occupierStart)
      return setRecordError('The tenancy has to end after it starts.');

    setRecordError(null);
    try {
      await onRecordOccupier(recordingUnit.id, {
        tenantName,
        rentAmount,
        leaseStart: occupierStart,
        leaseEnd: occupierEnd,
      });
      setRecordingUnit(null);
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : 'Unable to record the occupier.');
    }
  };

  if (units.length === 0) {
    return <EmptyState icon={DoorClosed} title="No units found" />;
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Unit</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Property</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Details</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Rent</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Tenant</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {units.map((unit) => {
              const status = statusConfig[unit.occupancyStatus];
              return (
                <tr key={unit.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {unit.unitName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {unit.propertyName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" />
                      {unit.bedrooms}
                    </span>
                    <span className="inline-flex items-center gap-1 ml-3">
                      <Bath className="w-3.5 h-3.5" />
                      {unit.bathrooms}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium whitespace-nowrap">
                    {/* The agreed rent once let, otherwise the asking rent the
                        advert publishes. */}
                    {unit.leaseRent !== undefined || unit.askingRent !== undefined
                      ? formatCurrency((unit.leaseRent ?? unit.askingRent)!, {
                          compact: true,
                        })
                      : '\u2014'}
                    {rentSuffix(unit.leaseRentPeriod ?? unit.askingRentPeriod)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {unit.tenantName || '—'}
                  </td>
                  <td className="px-4 py-3 relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          label={`Actions for ${unit.unitName}`}
                          size="sm"
                          icon={<MoreVertical />}
                          isLoading={pendingUnitId === unit.id}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {unit.occupancyStatus === 'occupied' && (
                          <DropdownMenuItem onSelect={() => onChargeUnit(unit)}>
                            <ReceiptText className="w-3.5 h-3.5" />
                            Charge rent
                          </DropdownMenuItem>
                        )}
                        {unit.occupancyStatus === 'vacant' ? (
                          <DropdownMenuItem onSelect={() => openRecorder(unit)}>
                            <UserPlus className="w-3.5 h-3.5" />
                            Record occupier
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setVacatingUnit(unit)}>
                            <DoorClosed className="w-3.5 h-3.5" />
                            Mark Vacant
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {recordingUnit?.id === unit.id && (
                      <div className="absolute right-4 top-10 z-30 w-80 bg-card rounded-lg shadow-lg border border-border p-3">
                        <p className="mb-3 text-xs text-muted-foreground">
                          Records who lives here and what they pay. It creates a tenancy you track
                          in GetRentos — the occupier will not be able to sign in, pay in-app, or
                          use their trust score.
                        </p>
                        <label
                          htmlFor={`occupier-name-${unit.id}`}
                          className="block text-xs font-medium text-foreground mb-1.5"
                        >
                          Occupier name
                        </label>
                        <Input
                          id={`occupier-name-${unit.id}`}
                          type="text"
                          autoFocus
                          controlSize="sm"
                          value={occupierName}
                          onChange={(e) => setOccupierName(e.target.value)}
                          placeholder="e.g. Adaeze Okafor"
                        />

                        <label
                          htmlFor={`occupier-rent-${unit.id}`}
                          className="mt-2 block text-xs font-medium text-foreground mb-1.5"
                        >
                          Rent per period
                        </label>
                        <Input
                          id={`occupier-rent-${unit.id}`}
                          type="number"
                          controlSize="sm"
                          value={occupierRent}
                          onChange={(e) => setOccupierRent(e.target.value)}
                          placeholder="0"
                        />

                        <div className="mt-2 flex gap-2">
                          <div className="flex-1">
                            <label
                              htmlFor={`occupier-start-${unit.id}`}
                              className="block text-xs font-medium text-foreground mb-1.5"
                            >
                              Starts
                            </label>
                            <Input
                              id={`occupier-start-${unit.id}`}
                              type="date"
                              controlSize="sm"
                              value={occupierStart}
                              onChange={(e) => setOccupierStart(e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <label
                              htmlFor={`occupier-end-${unit.id}`}
                              className="block text-xs font-medium text-foreground mb-1.5"
                            >
                              Ends
                            </label>
                            <Input
                              id={`occupier-end-${unit.id}`}
                              type="date"
                              controlSize="sm"
                              value={occupierEnd}
                              onChange={(e) => setOccupierEnd(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="xs"
                            className="flex-1"
                            onClick={handleRecordSubmit}
                            disabled={!occupierName.trim()}
                            isLoading={pendingUnitId === unit.id}
                          >
                            Save tenancy
                          </Button>
                          <Button
                            size="xs"
                            variant="secondary"
                            className="flex-1"
                            onClick={closeRecorder}
                          >
                            Cancel
                          </Button>
                        </div>
                        {recordError && (
                          <p className="mt-2 text-xs text-destructive" role="alert">
                            {recordError}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={Boolean(vacatingUnit)}
        onOpenChange={(open) => !open && setVacatingUnit(null)}
        title="Remove this tenant?"
        description={`This removes ${vacatingUnit?.tenantName ?? 'the tenant'} from ${vacatingUnit?.unitName ?? 'this unit'} and marks it vacant. Historical records are retained; an active signed lease must be terminated first.`}
        confirmLabel="Remove tenant"
        isLoading={Boolean(vacatingUnit && pendingUnitId === vacatingUnit.id)}
        onConfirm={async () => {
          if (!vacatingUnit) return;
          try {
            await onMarkVacant(vacatingUnit.id);
            setVacatingUnit(null);
          } catch {
            // The page mutation presents the API error; keep the dialog open for retry.
          }
        }}
      />
    </div>
  );
};
