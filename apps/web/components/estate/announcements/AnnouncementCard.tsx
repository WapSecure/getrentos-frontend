'use client';

import { Megaphone, Pencil, Trash2 } from '@sureground/icons';
import { Badge, IconButton } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
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
  const isUrgent = announcement.priority === 'urgent';
  return (
    <EstateRow
      align="start"
      leading={<RowAvatar icon={Megaphone} tone={isUrgent ? 'danger' : 'neutral'} />}
      title={
        <>
          <p className="truncate text-sm font-semibold text-foreground">{announcement.title}</p>
          {isUrgent && <Badge variant="danger">Urgent</Badge>}
        </>
      }
      meta={<p className="tabular-nums">Posted {formatDate(announcement.createdAt)}</p>}
      actions={
        <>
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
        </>
      }
    >
      <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm leading-6 text-foreground/90">
        {announcement.body}
      </p>
    </EstateRow>
  );
};
