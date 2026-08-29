'use client';

import { useQuery } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { Badge, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';

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

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground mt-1">
          {data?.total ?? 0} announcements from your estate
        </p>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : announcements.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Your estate manager hasn't posted anything yet."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                {announcement.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
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
