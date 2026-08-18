'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApplicationsHeader } from '@/components/renter/applications/ApplicationsHeader';
import { ApplicationsStats } from '@/components/renter/applications/ApplicationsStats';
import { ApplicationsFilterSort } from '@/components/renter/applications/ApplicationsFilterSort';
import { ApplicationsList } from '@/components/renter/applications/ApplicationsList';
import { ApplicationAnalytics } from '@/components/renter/applications/ApplicationAnalytics';
import { ApplicationRecommendations } from '@/components/renter/applications/ApplicationRecommendations';
import { ApplicationExport } from '@/components/renter/applications/ApplicationExport';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { Pagination } from '@getrentos/ui';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: [...renterKeys.applications, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(renterService.listMyApplications({ page, pageSize: PAGE_SIZE })),
  });
  const applications = data?.items ?? [];
  const total = data?.total ?? 0;
  // Private notes are persisted server-side (ApplicationNote records).
  const { data: allNotes = [] } = useQuery({
    queryKey: renterKeys.allApplicationNotes,
    queryFn: () => unwrap(renterService.listAllApplicationNotes()),
  });
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'under_review' | 'approved' | 'rejected'
  >('all');
  const [sortBy, setSortBy] = useState<'recent' | 'property' | 'status'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showExportModal, setShowExportModal] = useState(false);

  const notes: Record<string, Note[]> = allNotes.reduce<Record<string, Note[]>>((acc, note) => {
    (acc[note.applicationId] ||= []).push(note);
    return acc;
  }, {});

  const invalidateNotes = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.allApplicationNotes });

  const addNoteMutation = useMutation({
    mutationFn: ({ applicationId, content }: { applicationId: string; content: string }) =>
      unwrap(renterService.createApplicationNote(applicationId, content)),
    onSuccess: invalidateNotes,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: ({ applicationId, noteId }: { applicationId: string; noteId: string }) =>
      unwrap(renterService.deleteApplicationNote(applicationId, noteId)),
    onSuccess: invalidateNotes,
  });

  const editNoteMutation = useMutation({
    mutationFn: ({
      applicationId,
      noteId,
      content,
    }: {
      applicationId: string;
      noteId: string;
      content: string;
    }) => unwrap(renterService.updateApplicationNote(applicationId, noteId, content)),
    onSuccess: invalidateNotes,
  });

  const handleAddNote = (applicationId: string, content: string) => {
    addNoteMutation.mutate({ applicationId, content });
  };

  const handleDeleteNote = (applicationId: string, noteId: string) => {
    deleteNoteMutation.mutate({ applicationId, noteId });
  };

  const handleEditNote = (applicationId: string, noteId: string, content: string) => {
    editNoteMutation.mutate({ applicationId, noteId, content });
  };

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => unwrap(renterService.withdrawApplication(applicationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.applications });
      queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
    },
  });

  const handleWithdrawApplication = (applicationId: string) =>
    withdrawMutation.mutate(applicationId);

  return (
    <>
      <ApplicationsHeader applications={applications} onExport={() => setShowExportModal(true)} />

      <ApplicationsStats applications={applications} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ApplicationsFilterSort
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          <ApplicationsList
            applications={applications}
            filterStatus={filterStatus}
            sortBy={sortBy}
            viewMode={viewMode}
            onWithdraw={handleWithdrawApplication}
            notes={notes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleEditNote}
          />
        </div>

        <div className="space-y-6">
          <ApplicationAnalytics applications={applications} />
          <ApplicationRecommendations applications={applications} />
        </div>
      </div>

      <ApplicationExport
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        applications={applications}
      />

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
