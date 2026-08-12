'use client';

import { useState, useEffect } from 'react';
import { ApplicationsHeader } from '@/components/renter/applications/ApplicationsHeader';
import { ApplicationsStats } from '@/components/renter/applications/ApplicationsStats';
import { ApplicationsFilterSort } from '@/components/renter/applications/ApplicationsFilterSort';
import { ApplicationsList } from '@/components/renter/applications/ApplicationsList';
import { ApplicationAnalytics } from '@/components/renter/applications/ApplicationAnalytics';
import { ApplicationRecommendations } from '@/components/renter/applications/ApplicationRecommendations';
import { ApplicationExport } from '@/components/renter/applications/ApplicationExport';
import { Application } from '@/types/renter';
import { renterService } from '@/services/renterService';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
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

  useEffect(() => {
    const fetchApplications = async () => {
      const response = await renterService.listMyApplications();
      if (response.success && response.data) setApplications(response.data);
    };

    fetchApplications();
  }, []);

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

  const handleWithdrawApplication = async (applicationId: string) => {
    const response = await renterService.withdrawApplication(applicationId);
    if (response.success && response.data) {
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? response.data! : app))
      );
    }
  };

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
