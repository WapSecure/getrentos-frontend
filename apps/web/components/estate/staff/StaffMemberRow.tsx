'use client';

import { Trash2 } from 'lucide-react';
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
      <button
        onClick={onRemove}
        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
