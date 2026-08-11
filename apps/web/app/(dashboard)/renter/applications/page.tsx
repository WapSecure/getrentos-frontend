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
  const [notes, setNotes] = useState<Record<string, Note[]>>({});

  // Move loadApplications BEFORE useEffect
  const loadApplications = () => {
    const mockApplications: Application[] = [
      {
        id: '1',
        propertyId: 'prop_001',
        title: 'Modern Downtown Loft',
        address: '420 Main St, Ikeja, Lagos',
        status: 'under_review',
        date: '2024-06-07',
        price: 2400000,
        period: 'year',
        bedrooms: 2,
        bathrooms: 2,
        size: 1200,
        image: '',
        applicationDate: '2024-06-07',
        moveInDate: '2024-07-01',
        leaseTerm: '12 months',
        documents: [
          { name: 'Government ID', uploaded: true, required: true },
          { name: 'Proof of Income', uploaded: true, required: true },
          { name: 'Bank Statement', uploaded: true, required: true },
          { name: 'Reference Letter', uploaded: false, required: false },
        ],
        landlord: {
          name: 'Jane Smith',
          email: 'jane.smith@email.com',
          phone: '+1 234 567 8900',
          responseRate: 95,
          rating: 4.9,
        },
        applicationNotes: 'Great property, perfect location for my commute',
        timeline: [
          { stage: 'Application Submitted', date: '2024-06-07', completed: true },
          { stage: 'Under Review', date: '2024-06-08', completed: true },
          { stage: 'Landlord Decision', date: '2024-06-14', completed: false },
          { stage: 'Move-in', date: '2024-07-01', completed: false },
        ],
      },
      {
        id: '2',
        propertyId: 'prop_002',
        title: 'Cozy Studio Apartment',
        address: '123 Victoria Island, Lagos',
        status: 'pending',
        date: '2024-06-05',
        price: 1800000,
        period: 'year',
        bedrooms: 1,
        bathrooms: 1,
        size: 650,
        image: '',
        applicationDate: '2024-06-05',
        moveInDate: '2024-07-15',
        leaseTerm: '6 months',
        documents: [
          { name: 'Government ID', uploaded: true, required: true },
          { name: 'Proof of Income', uploaded: false, required: true },
          { name: 'Bank Statement', uploaded: false, required: true },
        ],
        landlord: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+1 234 567 8901',
          responseRate: 88,
          rating: 4.7,
        },
        applicationNotes: '',
        timeline: [
          { stage: 'Application Submitted', date: '2024-06-05', completed: true },
          { stage: 'Under Review', date: '2024-06-07', completed: false },
          { stage: 'Landlord Decision', date: 'Pending', completed: false },
          { stage: 'Move-in', date: '2024-07-15', completed: false },
        ],
      },
      {
        id: '3',
        propertyId: 'prop_003',
        title: 'Luxury Beachfront Villa',
        address: '456 Elegushi Beach, Lagos',
        status: 'approved',
        date: '2024-05-28',
        price: 9600000,
        period: 'year',
        bedrooms: 4,
        bathrooms: 3,
        size: 3200,
        image: '',
        applicationDate: '2024-05-28',
        moveInDate: '2024-06-15',
        leaseTerm: '24 months',
        documents: [
          { name: 'Government ID', uploaded: true, required: true },
          { name: 'Proof of Income', uploaded: true, required: true },
          { name: 'Bank Statement', uploaded: true, required: true },
          { name: 'Reference Letter', uploaded: true, required: false },
        ],
        landlord: {
          name: 'Sarah Williams',
          email: 'sarah.williams@email.com',
          phone: '+1 234 567 8902',
          responseRate: 98,
          rating: 5.0,
        },
        applicationNotes: 'Approved! Landlord was very responsive',
        timeline: [
          { stage: 'Application Submitted', date: '2024-05-28', completed: true },
          { stage: 'Under Review', date: '2024-05-29', completed: true },
          { stage: 'Landlord Decision', date: '2024-06-02', completed: true },
          { stage: 'Move-in', date: '2024-06-15', completed: false },
        ],
      },
      {
        id: '4',
        propertyId: 'prop_004',
        title: 'Affordable 2-Bed Flat',
        address: '321 Surulere, Lagos',
        status: 'rejected',
        date: '2024-05-20',
        price: 1440000,
        period: 'year',
        bedrooms: 2,
        bathrooms: 1,
        size: 950,
        image: '',
        applicationDate: '2024-05-20',
        moveInDate: '2024-06-01',
        leaseTerm: '12 months',
        documents: [
          { name: 'Government ID', uploaded: true, required: true },
          { name: 'Proof of Income', uploaded: true, required: true },
          { name: 'Bank Statement', uploaded: true, required: true },
        ],
        landlord: {
          name: 'Michael Brown',
          email: 'michael.brown@email.com',
          phone: '+1 234 567 8903',
          responseRate: 75,
          rating: 4.2,
        },
        applicationNotes: 'Application was rejected due to high competition',
        timeline: [
          { stage: 'Application Submitted', date: '2024-05-20', completed: true },
          { stage: 'Under Review', date: '2024-05-22', completed: true },
          { stage: 'Landlord Decision', date: '2024-05-25', completed: true },
          { stage: 'Move-in', date: 'Cancelled', completed: false },
        ],
      },
    ];

    const submitted = localStorage.getItem('renter_submitted_applications');
    const submittedApplications: Application[] = submitted ? JSON.parse(submitted) : [];

    setApplications([...submittedApplications, ...mockApplications]);
  };

  const loadNotes = () => {
    const saved = localStorage.getItem('application_notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  };

  // Now useEffect can safely call the functions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadApplications();
    loadNotes();
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

  const handleWithdrawApplication = (applicationId: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, status: 'rejected' as const } : app))
    );
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
