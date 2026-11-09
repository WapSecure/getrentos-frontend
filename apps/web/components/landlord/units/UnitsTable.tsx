'use client';

import { useState } from 'react';
import {
  Badge,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  type BadgeVariant,
} from '@sureground/ui';
import { Bed, Bath, UserPlus, DoorClosed, MoreVertical, ReceiptText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { rentSuffix } from '@/lib/leaseTerm';
import type { Unit, UnitOccupancyStatus } from '@/types/landlord';

const statusConfig: Record<UnitOccupancyStatus, { label: string; variant: BadgeVariant }> = {
  occupied: { label: 'Occupied', variant: 'success' },
  vacant: { label: 'Vacant', variant: 'warning' },
  notice_given: { label: 'Notice given', variant: 'info' },
};

interface UnitsTableProps {
  units: Unit[];
  onMarkVacant: (unitId: string) => Promise<void>;
  onRecordOccupier: (unit: Unit) => void;
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
  const [vacatingUnit, setVacatingUnit] = useState<Unit | null>(null);

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
                          <DropdownMenuItem onSelect={() => onRecordOccupier(unit)}>
                            <UserPlus className="w-3.5 h-3.5" />
                            Record occupier
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => setVacatingUnit(unit)}>
                            <DoorClosed className="w-3.5 h-3.5" />
                            Mark vacant
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
