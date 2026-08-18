'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import type { Announcement } from '@/types/estate';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: () => void;
  onRemove: () => void;
}

export const AnnouncementCard = ({ announcement, onEdit, onRemove }: AnnouncementCardProps) => {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{announcement.title}</p>
            {announcement.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(announcement.createdAt)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{announcement.body}</p>
    </div>
  );
};
