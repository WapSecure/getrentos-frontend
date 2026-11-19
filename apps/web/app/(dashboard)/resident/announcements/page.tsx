'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Megaphone, Square, Volume2 } from '@sureground/icons';
import {
  Badge,
  EmptyState,
  IconButton,
  ListSkeleton,
  PageHeader,
  Pagination,
} from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { useReadAloud } from '@/lib/voice';

const PAGE_SIZE = 10;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export default function ResidentAnnouncementsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.announcements(page, PAGE_SIZE),
    queryFn: () => unwrap(estateResidentService.listMyAnnouncements({ page, pageSize: PAGE_SIZE })),
  });
  const announcements = data?.items ?? [];
  const readAloud = useReadAloud();

  return (
    <>
      <PageHeader
        title="Announcements"
        description={
          <>
            {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'announcement' : 'announcements'} from
            your estate
          </>
        }
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
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
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
                        readAloud.speaking === i
                          ? 'Stop reading'
                          : `Listen to ${announcement.title}`
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
          {(data?.total ?? 0) > PAGE_SIZE && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data?.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </>
  );
}
