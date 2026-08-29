'use client';

import { Mail, Phone, Pencil, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { Badge } from '@getrentos/ui';
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
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
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
          <button
            onClick={onUnlinkResident}
            title="Unlink resident account"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onLinkResident}
            title="Link a resident account"
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
