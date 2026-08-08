'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { VerificationRequestCard } from '@/components/admin/verifications/VerificationRequestCard';
import { ReviewVerificationModal } from '@/components/admin/verifications/ReviewVerificationModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type {
  VerificationRequest,
  VerificationRequestStatus,
  VerificationRequestType,
} from '@/types/admin';

const mockRequests: VerificationRequest[] = [
  {
    id: 'vr_001',
    applicantName: 'Segun Alabi',
    applicantRole: 'owner',
    type: 'property',
    subjectLabel: 'Ikeja GRA Townhouse',
    status: 'pending_review',
    submittedAt: '2026-08-07T00:00:00.000Z',
    documentCount: 2,
  },
  {
    id: 'vr_002',
    applicantName: 'Emeka Chukwu',
    applicantRole: 'landlord',
    type: 'property',
    subjectLabel: 'Sunrise Apartments',
    status: 'pending_review',
    submittedAt: '2026-08-06T00:00:00.000Z',
    documentCount: 3,
  },
  {
    id: 'vr_003',
    applicantName: 'Chidinma Nwosu',
    applicantRole: 'realtor',
    type: 'license',
    subjectLabel: 'Real Estate Agent License',
    status: 'approved',
    submittedAt: '2026-01-04T00:00:00.000Z',
    documentCount: 1,
  },
  {
    id: 'vr_004',
    applicantName: 'David Okoro',
    applicantRole: 'renter',
    type: 'identity',
    subjectLabel: 'National ID Verification',
    status: 'needs_clarification',
    submittedAt: '2026-08-05T00:00:00.000Z',
    documentCount: 1,
    rejectionReason: 'Uploaded ID image is blurry, please resubmit.',
  },
];

type StatusFilter = 'all' | VerificationRequestStatus;
type TypeFilter = 'all' | VerificationRequestType;

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);

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
        if (parsedUser.role && parsedUser.role !== 'admin') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setRequests(mockRequests);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleApprove = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
  };

  const handleReject = (id: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );
  };

  const handleRequestClarification = (id: string, reason: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'needs_clarification', rejectionReason: reason } : r
      )
    );
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subjectLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'needs_clarification', label: 'Needs Info' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'identity', label: 'Identity' },
    { value: 'property', label: 'Property' },
    { value: 'license', label: 'License' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verification Queue
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {requests.filter((r) => r.status === 'pending_review').length} request
                {requests.filter((r) => r.status === 'pending_review').length === 1 ? '' : 's'}{' '}
                awaiting review
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by applicant or subject..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-fit"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto mb-6">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No requests match your filters
                </h3>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRequests.map((request, index) => (
                  <VerificationRequestCard
                    key={request.id}
                    request={request}
                    delay={index * 0.05}
                    onReview={() => setActiveRequest(request)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <ReviewVerificationModal
        request={activeRequest}
        onClose={() => setActiveRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestClarification={handleRequestClarification}
      />
    </div>
  );
}
