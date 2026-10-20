'use client';

import { Mail, Phone, Pencil, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { Badge, IconButton } from '@getrentos/ui';
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
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{household.unitLabel}</p>
          <Badge variant={household.status === 'active' ? 'success' : 'neutral'}>
            {household.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={household.residentLinked ? 'success' : 'neutral'}>
            {household.residentLinked ? 'Resident linked' : 'No resident account'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{household.residentName}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
          {household.contactPhone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {household.contactPhone}
            </span>
          )}
          {household.contactEmail && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {household.contactEmail}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
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
      </div>
    </div>
  );
};
