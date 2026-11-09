'use client';

import { useQuery } from '@tanstack/react-query';
import { Megaphone, Square, Volume2 } from 'lucide-react';
import { Badge, EmptyState, IconButton, ListSkeleton, PageHeader } from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { useReadAloud } from '@/lib/voice';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export default function ResidentAnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.announcements,
    queryFn: () => unwrap(estateResidentService.listMyAnnouncements({ pageSize: 50 })),
  });
  const announcements = data?.items ?? [];
  // Listen to an update instead of reading it, with the browser's own voice.
  const readAloud = useReadAloud();

  return (
    <>
      <PageHeader
        title="Announcements"
        description={<>{data?.total ?? 0} announcements from your estate</>}
      />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Your estate manager hasn't posted anything yet."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {announcements.map((announcement, i) => (
            <div key={announcement.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                {announcement.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
                {readAloud.canRead('en') && (
                  <IconButton
                    className="ml-auto"
                    size="sm"
                    label={
                      readAloud.speaking === i ? 'Stop reading' : `Listen to ${announcement.title}`
                    }
                    icon={readAloud.speaking === i ? <Square /> : <Volume2 />}
                    onClick={() =>
                      readAloud.toggle(i, `${announcement.title}. ${announcement.body}`, 'en')
                    }
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(announcement.createdAt)}
              </p>
              <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                {announcement.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
