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

interface UnitsTableProps {
  units: Unit[];
  onMarkVacant: (unitId: string) => Promise<void>;
  onAssignTenant: (unitId: string, tenantName: string) => Promise<void>;
  onChargeUnit: (unit: Unit) => void;
  pendingUnitId?: string;
}

export const UnitsTable = ({
  units,
  onMarkVacant,
  onAssignTenant,
  onChargeUnit,
  pendingUnitId,
}: UnitsTableProps) => {
  const [assigningUnitId, setAssigningUnitId] = useState<string | null>(null);
  const [tenantNameInput, setTenantNameInput] = useState('');
  const [vacatingUnit, setVacatingUnit] = useState<Unit | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const handleAssignSubmit = async (unitId: string) => {
    if (!tenantNameInput.trim()) return;
    setAssignError(null);
    try {
      await onAssignTenant(unitId, tenantNameInput.trim());
      setAssigningUnitId(null);
      setTenantNameInput('');
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Unable to assign tenant.');
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
                          <DropdownMenuItem onSelect={() => setAssigningUnitId(unit.id)}>
                            <UserPlus className="w-3.5 h-3.5" />
                            Assign Tenant
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setVacatingUnit(unit)}>
                            <DoorClosed className="w-3.5 h-3.5" />
                            Mark Vacant
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {assigningUnitId === unit.id && (
                      <div className="absolute right-4 top-10 z-30 w-56 bg-card rounded-lg shadow-lg border border-border p-3">
                        <label
                          htmlFor={`assign-tenant-${unit.id}`}
                          className="block text-xs font-medium text-foreground mb-1.5"
                        >
                          Tenant name
                        </label>
                        <Input
                          id={`assign-tenant-${unit.id}`}
                          type="text"
                          autoFocus
                          controlSize="sm"
                          value={tenantNameInput}
                          onChange={(e) => setTenantNameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAssignSubmit(unit.id)}
                          placeholder="e.g. Adaeze Okafor"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="xs"
                            className="flex-1"
                            onClick={() => handleAssignSubmit(unit.id)}
                            disabled={!tenantNameInput.trim()}
                            isLoading={pendingUnitId === unit.id}
                          >
                            Assign
                          </Button>
                          <Button
                            size="xs"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => {
                              setAssigningUnitId(null);
                              setTenantNameInput('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        {assignError && (
                          <p className="mt-2 text-xs text-destructive" role="alert">
                            {assignError}
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
