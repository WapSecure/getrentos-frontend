'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { ApplicationCard } from '@/components/landlord/applications/ApplicationCard';
import { ApplicationDetailsModal } from '@/components/landlord/applications/ApplicationDetailsModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
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
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<RentalApplication[]>([]);
  const [filter, setFilter] = useState<'all' | ApplicationStatus>('all');
  const [selectedApplication, setSelectedApplication] = useState<RentalApplication | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setApplications(mockApplications);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const updateStatus = (id: string, status: ApplicationStatus) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setSelectedApplication((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const handleApprove = (id: string) => updateStatus(id, 'approved');
  const handleReject = (id: string) => updateStatus(id, 'rejected');
  const handleRequestInfo = (id: string) => updateStatus(id, 'under_review');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredApplications = applications.filter((a) => filter === 'all' || a.status === filter);
  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {pendingCount} application{pendingCount === 1 ? '' : 's'} awaiting review
              </p>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit mb-6 overflow-x-auto">
              {statusFilters.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredApplications.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No applications found</p>
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
          </div>
        </main>
      </div>

      <ApplicationDetailsModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestInfo={handleRequestInfo}
      />
    </div>
  );
}
