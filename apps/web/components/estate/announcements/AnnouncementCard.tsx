'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Badge, IconButton } from '@getrentos/ui';
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
          <IconButton
            label={`Edit ${announcement.title}`}
            icon={<Pencil />}
            size="sm"
            onClick={onEdit}
          />
          <IconButton
            label={`Delete ${announcement.title}`}
            icon={<Trash2 />}
            variant="danger"
            size="sm"
            onClick={onRemove}
          />
        </div>
      </div>
      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{announcement.body}</p>
    </div>
  );
};
