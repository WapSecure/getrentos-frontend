'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Application } from '@/types/renter';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { FileText } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationsListProps {
  applications: Application[];
  filterStatus: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';
  sortBy: 'recent' | 'property' | 'status';
  viewMode: 'grid' | 'list';
  onWithdraw?: (id: string) => void;
  notes?: Record<string, Note[]>;
  onAddNote?: (applicationId: string, content: string) => void;
  onDeleteNote?: (applicationId: string, noteId: string) => void;
  onEditNote?: (applicationId: string, noteId: string, content: string) => void;
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

  // Filter applications
  const filteredApplications = applications.filter(
    (app) => filterStatus === 'all' || app.status === filterStatus
  );

  // Sort applications
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

  const handleWithdraw = (id: string) => {
    if (onWithdraw) {
      onWithdraw(id);
    }
  };

  if (sortedApplications.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No applications found</h3>
        <p className="text-muted-foreground mt-1">
          {filterStatus === 'all'
            ? "You haven't submitted any applications yet"
            : `No ${filterStatus} applications found`}
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}
        >
          {sortedApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ApplicationCard
                application={application}
                viewMode={viewMode}
                onViewDetails={() => handleViewDetails(application)}
                onWithdraw={() => handleWithdraw(application.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Application Details Modal */}
      {selectedApplication && (
        <ApplicationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          application={selectedApplication}
          onWithdraw={handleWithdraw}
          notes={notes[selectedApplication.id] || []}
          onAddNote={onAddNote}
          onDeleteNote={onDeleteNote}
          onEditNote={onEditNote}
        />
      )}
    </>
  );
};
