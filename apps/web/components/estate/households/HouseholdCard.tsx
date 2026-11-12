'use client';

import { Mail, Phone, Pencil, Trash2, UserPlus, UserMinus } from '@sureground/icons';
import { Badge, IconButton } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
import type { Household } from '@/types/estate';

interface HouseholdCardProps {
  household: Household;
  onEdit: () => void;
  onRemove: () => void;
  onLinkResident: () => void;
  onUnlinkResident: () => void;
}

export const HouseholdCard = ({
  household,
  onEdit,
  onRemove,
  onLinkResident,
  onUnlinkResident,
}: HouseholdCardProps) => {
  const isActive = household.status === 'active';
  return (
    <EstateRow
      leading={<RowAvatar name={household.residentName} />}
      title={
        <>
          <p className="truncate text-sm font-medium text-foreground">{household.unitLabel}</p>
          {!isActive && <Badge variant="neutral">Inactive</Badge>}
          <Badge variant={household.residentLinked ? 'success' : 'neutral'}>
            {household.residentLinked ? 'Resident linked' : 'No resident account'}
          </Badge>
        </>
      }
      meta={
        <>
          <p className="truncate">{household.residentName}</p>
          {(household.contactPhone || household.contactEmail) && (
            <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
              {household.contactPhone && (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {household.contactPhone}
                </span>
              )}
              {household.contactEmail && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{household.contactEmail}</span>
                </span>
              )}
            </p>
          )}
        </>
      }
      actions={
        <>
          {household.residentLinked ? (
            <IconButton
              label="Unlink resident account"
              icon={<UserMinus />}
              size="sm"
              onClick={onUnlinkResident}
            />
          ) : (
            <IconButton
              label="Link a resident account"
              icon={<UserPlus />}
              size="sm"
              onClick={onLinkResident}
            />
          )}
          <IconButton
            label={`Edit ${household.unitLabel}`}
            icon={<Pencil />}
            size="sm"
            onClick={onEdit}
          />
          <IconButton
            label={`Remove ${household.unitLabel}`}
            icon={<Trash2 />}
            variant="danger"
            size="sm"
            onClick={onRemove}
          />
        </>
      }
    />
  );
};
