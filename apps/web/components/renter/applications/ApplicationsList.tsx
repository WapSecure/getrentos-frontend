'use client';

import { useState } from 'react';
import { Application } from '@/types/renter';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { ApplicationWithdrawModal } from './ApplicationWithdrawModal';
import { FileText } from 'lucide-react';
import { EmptyState } from '@sureground/ui';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationsListProps {
  applications: Application[];
  filterStatus: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  sortBy: 'recent' | 'property' | 'status';
  viewMode: 'grid' | 'list';
  onWithdraw?: (id: string, reason: string) => Promise<void>;
  notes?: Record<string, Note[]>;
  onAddNote?: (applicationId: string, content: string) => Promise<boolean>;
  onDeleteNote?: (applicationId: string, noteId: string) => void;
  onEditNote?: (applicationId: string, noteId: string, content: string) => Promise<boolean>;
}

export const ApplicationsList = ({
  applications,
  filterStatus,
  sortBy,
  viewMode,
  onWithdraw,
  notes = {},
  onAddNote,
  onDeleteNote,
  onEditNote,
}: ApplicationsListProps) => {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [withdrawApplication, setWithdrawApplication] = useState<Application | null>(null);

  const filteredApplications = applications.filter(
    (app) => filterStatus === 'all' || app.status === filterStatus
  );

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      case 'property':
        return a.title.localeCompare(b.title);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  if (sortedApplications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No applications found"
        description={
          filterStatus === 'all'
            ? "You haven't submitted any applications yet."
            : `There are no ${filterStatus.replace('_', ' ')} applications in this view.`
        }
      />
    );
  }

  return (
    <>
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 xl:grid-cols-2' : 'space-y-4'}>
        {sortedApplications.map((application) => (
          <div key={application.id}>
            <ApplicationCard
              application={application}
              viewMode={viewMode}
              onViewDetails={() => handleViewDetails(application)}
              onWithdraw={() => setWithdrawApplication(application)}
            />
          </div>
        ))}
      </div>

      {selectedApplication && (
        <ApplicationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          application={selectedApplication}
          onWithdraw={onWithdraw}
          notes={notes[selectedApplication.id] || []}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          onEditNote={onEditNote}
        />
      )}

      {withdrawApplication && onWithdraw && (
        <ApplicationWithdrawModal
          isOpen
          application={withdrawApplication}
          onClose={() => setWithdrawApplication(null)}
          onWithdraw={onWithdraw}
        />
      )}
    </>
  );
};
