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

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const { data: applications = [] } = useQuery({
    queryKey: renterKeys.applications,
    queryFn: () => unwrap(renterService.listMyApplications()),
  });
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'under_review' | 'approved' | 'rejected'
  >('all');
  const [sortBy, setSortBy] = useState<'recent' | 'property' | 'status'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showExportModal, setShowExportModal] = useState(false);
  const [notes, setNotes] = useState<Record<string, Note[]>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('application_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const saveNotes = (updatedNotes: Record<string, Note[]>) => {
    localStorage.setItem('application_notes', JSON.stringify(updatedNotes));
  };

  const handleAddNote = (applicationId: string, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = {
      ...notes,
      [applicationId]: [...(notes[applicationId] || []), newNote],
    };
    setNotes(updated);
    saveNotes(updated);
  };

  const handleDeleteNote = (applicationId: string, noteId: string) => {
    const updated = {
      ...notes,
      [applicationId]: (notes[applicationId] || []).filter((n) => n.id !== noteId),
    };
    setNotes(updated);
    saveNotes(updated);
  };

  const handleEditNote = (applicationId: string, noteId: string, content: string) => {
    const updated = {
      ...notes,
      [applicationId]: (notes[applicationId] || []).map((n) =>
        n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
      ),
    };
    setNotes(updated);
    saveNotes(updated);
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
    </>
  );
}
