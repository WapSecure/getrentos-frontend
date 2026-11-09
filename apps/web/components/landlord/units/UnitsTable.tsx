'use client';

import { useState } from 'react';
import {
  Badge,
  ConfirmDialog,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  IconButton,
  type BadgeVariant,
} from '@sureground/ui';
import { Bed, Bath, UserPlus, DoorClosed, MoreVertical, ReceiptText } from '@sureground/icons';
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
    <>
      <DataTable
        caption="Units"
        data={units}
        getRowKey={(unit) => unit.id}
        columns={[
          {
            key: 'unit',
            header: 'Unit',
            className: 'font-medium text-foreground whitespace-nowrap',
            render: (unit) => unit.unitName,
          },
          {
            key: 'property',
            header: 'Property',
            className: 'text-muted-foreground whitespace-nowrap',
            render: (unit) => unit.propertyName,
          },
          {
            key: 'details',
            header: 'Details',
            className: 'text-muted-foreground whitespace-nowrap',
            render: (unit) => (
              <>
                <span className="inline-flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" />
                  {unit.bedrooms}
                </span>
                <span className="inline-flex items-center gap-1 ml-3">
                  <Bath className="w-3.5 h-3.5" />
                  {unit.bathrooms}
                </span>
              </>
            ),
          },
          {
            key: 'rent',
            header: 'Rent',
            className: 'text-foreground font-medium whitespace-nowrap',
            render: (unit) => (
              <>
                {unit.leaseRent !== undefined || unit.askingRent !== undefined
                  ? formatCurrency((unit.leaseRent ?? unit.askingRent)!, {
                      compact: true,
                    })
                  : '\u2014'}
                {rentSuffix(unit.leaseRentPeriod ?? unit.askingRentPeriod)}
              </>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (unit) => {
              const status = statusConfig[unit.occupancyStatus];
              return <Badge variant={status.variant}>{status.label}</Badge>;
            },
          },
          {
            key: 'tenant',
            header: 'Tenant',
            className: 'text-muted-foreground whitespace-nowrap',
            render: (unit) => unit.tenantName || '—',
          },
          {
            key: 'actions',
            header: '',
            srHeader: 'Actions',
            align: 'right',
            className: 'relative',
            render: (unit) => (
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
            ),
          },
        ]}
      />
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
    </>
  );
};
