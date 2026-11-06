'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus } from 'lucide-react';
import {
  Button,
  CardSkeleton,
  EmptyState,
  ListSkeleton,
  Pagination,
  PageHeader,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { AnnouncementModal } from '@/components/estate/announcements/AnnouncementModal';
import { AnnouncementCard } from '@/components/estate/announcements/AnnouncementCard';
import type { Announcement } from '@/types/estate';

const PAGE_SIZE = 10;

export default function EstateAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data, isLoading: isAnnouncementsLoading } = useQuery({
    queryKey: [...estateKeys.announcements(estate?.id ?? ''), { page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      unwrap(estateService.listAnnouncements(estate!.id, { page, pageSize: PAGE_SIZE })),
    enabled: !!estate,
    placeholderData: keepPreviousData,
  });
  const announcements = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: estateKeys.announcements(estate.id) });
  };

  const createAnnouncement = useMutation({
    mutationFn: (data: Parameters<typeof estateService.createAnnouncement>[1]) =>
      unwrap(estateService.createAnnouncement(estate!.id, data)),
    onSuccess: () => {
      invalidate();
      setPage(1);
      setIsModalOpen(false);
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title: string; body: string; priority?: 'NORMAL' | 'URGENT' };
    }) => unwrap(estateService.updateAnnouncement(estate!.id, id, data)),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
      setEditingAnnouncement(null);
    },
  });

  const removeAnnouncement = useMutation({
    mutationFn: (id: string) => unwrap(estateService.removeAnnouncement(estate!.id, id)),
    onSuccess: () => {
      invalidate();
      setPage((current) => (current > 1 && announcements.length === 1 ? current - 1 : current));
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  const handleSubmit = (data: {
    title: string;
    body: string;
    priority: 'NORMAL' | 'URGENT';
    deliveryChannels?: ('SMS' | 'WHATSAPP')[];
  }) => {
    if (editingAnnouncement) {
      updateAnnouncement.mutate({ id: editingAnnouncement.id, data });
    } else {
      createAnnouncement.mutate(data);
    }
  };

  return (
    <>
      <PageHeader
        title="Announcements"
        description={
          <>
            {isAnnouncementsLoading ? (
              'Loading…'
            ) : (
              <>
                {total} announcement{total === 1 ? '' : 's'}
              </>
            )}{' '}
            in {estate.name}
          </>
        }
        actions={
          <Button
            variant="primary"
            className="gap-2"
            onClick={() => {
              setEditingAnnouncement(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New announcement
          </Button>
        }
      />

      {isAnnouncementsLoading ? (
        <ListSkeleton rows={3} />
      ) : announcements.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Post a notice for all households in this estate to see."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={() => {
                setEditingAnnouncement(announcement);
                setIsModalOpen(true);
              }}
              onRemove={() => removeAnnouncement.mutate(announcement.id)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <AnnouncementModal
        key={editingAnnouncement?.id ?? 'new'}
        estateId={estate?.id}
        isOpen={isModalOpen}
        announcement={editingAnnouncement}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={createAnnouncement.isPending || updateAnnouncement.isPending}
      />
    </>
  );
}
