'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { ApplicationCard } from '@/components/landlord/applications/ApplicationCard';
import { ApplicationDetailsModal } from '@/components/landlord/applications/ApplicationDetailsModal';
import type { ApplicationStatus, RentalApplication } from '@/types/landlord';

const mockApplications: RentalApplication[] = [
  {
    id: 'app_001',
    applicantName: 'Bisi Adewale',
    applicantEmail: 'bisi.adewale@example.com',
    applicantPhone: '+234 802 111 2233',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitId: 'unit_004',
    unitName: 'Unit 4A',
    monthlyIncome: 850_000,
    employmentStatus: 'Full-time — Product Manager, Flutterwave',
    verificationStatus: 'verified',
    trustScore: 84,
    applicationDate: '2026-08-05T00:00:00.000Z',
    status: 'pending',
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'Proof of Income', uploaded: true },
      { name: 'Bank Statement', uploaded: false },
    ],
  },
  {
    id: 'app_002',
    applicantName: 'Emeka Chukwu',
    applicantEmail: 'emeka.chukwu@example.com',
    applicantPhone: '+234 809 222 3344',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitId: 'unit_007',
    unitName: 'Unit 2A',
    monthlyIncome: 620_000,
    employmentStatus: 'Self-employed — Consultant',
    verificationStatus: 'pending',
    trustScore: 58,
    applicationDate: '2026-08-04T00:00:00.000Z',
    status: 'under_review',
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'Proof of Income', uploaded: false },
    ],
  },
  {
    id: 'app_003',
    applicantName: 'Grace Iheanacho',
    applicantEmail: 'grace.iheanacho@example.com',
    applicantPhone: '+234 815 333 4455',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitId: 'unit_009',
    unitName: 'Unit B',
    monthlyIncome: 700_000,
    employmentStatus: 'Full-time — Nurse, Reddington Hospital',
    verificationStatus: 'verified',
    trustScore: 90,
    applicationDate: '2026-08-01T00:00:00.000Z',
    status: 'approved',
    documents: [
      { name: 'Government ID', uploaded: true },
      { name: 'Proof of Income', uploaded: true },
    ],
  },
];

const statusFilters: { value: 'all' | ApplicationStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function LandlordApplicationsPage() {
  const [applications, setApplications] = useState<RentalApplication[]>(mockApplications);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);

  const updateStatus = (id: string, status: ApplicationStatus) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setSelectedApplication((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const handleApprove = (id: string) => updateStatus(id, 'approved');
  const handleReject = (id: string) => updateStatus(id, 'rejected');
  const handleRequestInfo = (id: string) => updateStatus(id, 'under_review');

  const filteredApplications = applications.filter((a) => filter === 'all' || a.status === filter);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-muted-foreground mt-1">
          {pendingCount} application{pendingCount === 1 ? '' : 's'} awaiting review
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-6 overflow-x-auto">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No applications found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApplications.map((application, index) => (
            <ApplicationCard
              key={application.id}
              application={application}
              delay={index * 0.05}
              onViewDetails={() => setSelectedApplication(application)}
              onApprove={() => handleApprove(application.id)}
              onReject={() => handleReject(application.id)}
              onRequestInfo={() => handleRequestInfo(application.id)}
            />
          ))}
        </div>
      )}

      <ApplicationDetailsModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestInfo={handleRequestInfo}
      />
    </>
  );
}
