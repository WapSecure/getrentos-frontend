'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus } from '@sureground/icons';
import {
  Button,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Pagination,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { AnnouncementModal } from '@/components/estate/announcements/AnnouncementModal';
import { AnnouncementCard } from '@/components/estate/announcements/AnnouncementCard';
import type { Announcement } from '@/types/estate';
import {
  EstateListSection,
  EstateListSkeleton,
  EstateRowList,
} from '@/components/estate/shared/EstateListSection';

const PAGE_SIZE = 10;

export default function EstateAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [page, setPage] = useState(1);
  const [removing, setRemoving] = useState<Announcement | null>(null);
  const toast = useToast();

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
      if (removing) toast.success(`"${removing.title}" deleted.`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to delete this announcement.'),
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

  const openNew = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Announcements"
        description={`Notices every household in ${estate.name} can read.`}
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            New announcement
          </Button>
        }
      />

      <EstateListSection
        id="announcements"
        title="Posted"
        count={isAnnouncementsLoading ? undefined : total}
        countLabel={`${total} announcement${total === 1 ? '' : 's'}`}
        description="Edit a notice to correct it, or delete it to take it down for everyone."
        footer={
          total > PAGE_SIZE ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          ) : undefined
        }
      >
        {isAnnouncementsLoading ? (
          <EstateListSkeleton />
        ) : announcements.length === 0 ? (
          <EmptyState
            bare
            icon={Megaphone}
            title="No announcements yet"
            description="Post a notice for all households in this estate to see, such as a water outage or a meeting date."
            action={
              <Button variant="outline" size="sm" onClick={openNew}>
                Post the first notice
              </Button>
            }
          />
        ) : (
          <EstateRowList>
            {announcements.map((announcement) => (
              <li key={announcement.id}>
                <AnnouncementCard
                  announcement={announcement}
                  onEdit={() => {
                    setEditingAnnouncement(announcement);
                    setIsModalOpen(true);
                  }}
                  onRemove={() => setRemoving(announcement)}
                />
              </li>
            ))}
          </EstateRowList>
        )}
      </EstateListSection>

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

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Delete this announcement?"
        description={
          removing
            ? `"${removing.title}" is deleted and households in ${estate.name} will no longer see it. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => removing && removeAnnouncement.mutateAsync(removing.id)}
        isLoading={removeAnnouncement.isPending}
      />
    </>
  );
}
