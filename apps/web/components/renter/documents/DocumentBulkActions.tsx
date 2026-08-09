'use client';

import { Trash2, Share2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DocumentBulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onShare: () => void;
  onDownload: () => void;
  onClearSelection: () => void;
}

export const DocumentBulkActions = ({
  selectedCount,
  onDelete,
  onShare,
  onDownload,
  onClearSelection,
}: DocumentBulkActionsProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-card rounded-xl shadow-2xl border border-border p-3 flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{selectedCount} selected</span>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="p-1.5">
          <X className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="p-1.5"
          title="Download selected"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="p-1.5"
          title="Share selected"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete selected"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
