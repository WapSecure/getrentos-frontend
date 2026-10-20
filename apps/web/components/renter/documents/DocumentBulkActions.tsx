'use client';

import { Trash2, X } from 'lucide-react';
import { IconButton } from '@getrentos/ui';

interface DocumentBulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
}

export const DocumentBulkActions = ({
  selectedCount,
  onDelete,
  onClearSelection,
}: DocumentBulkActionsProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-card rounded-xl shadow-2xl border border-border p-3 flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{selectedCount} selected</span>
        <div className="h-6 w-px bg-border" />
        <IconButton label="Clear selection" icon={<X />} size="sm" onClick={onClearSelection} />
        <div className="h-6 w-px bg-border" />
        <IconButton
          label="Delete selected"
          icon={<Trash2 />}
          variant="danger"
          size="sm"
          onClick={onDelete}
        />
      </div>
    </div>
  );
};
