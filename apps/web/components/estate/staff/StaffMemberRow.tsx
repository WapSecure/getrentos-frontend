'use client';

import { Trash2 } from 'lucide-react';
import { IconButton } from '@getrentos/ui';
import type { StaffMember } from '@/types/estate';

interface StaffMemberRowProps {
  member: StaffMember;
  onRemove: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export const StaffMemberRow = ({ member, onRemove }: StaffMemberRowProps) => {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {member.email} · Gateman since {formatDate(member.addedAt)}
        </p>
      </div>
      <IconButton
        label={`Remove ${member.name}`}
        icon={<Trash2 />}
        variant="danger"
        size="sm"
        onClick={onRemove}
      />
    </div>
  );
};
