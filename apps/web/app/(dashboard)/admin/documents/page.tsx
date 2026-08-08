'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Upload, FolderOpen, Search } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { AdminDocument } from '@/types/admin';

const categoryLabels: Record<AdminDocument['category'], string> = {
  policy: 'Policy',
  compliance_filing: 'Compliance Filing',
  legal_agreement: 'Legal Agreement',
  report: 'Report',
};

const mockDocuments: AdminDocument[] = [
  {
    id: 'doc_001',
    name: 'GetRentos Platform Terms of Service v3.2.pdf',
    category: 'policy',
    uploadedAt: '2026-06-01T00:00:00.000Z',
    sizeLabel: '540 KB',
  },
  {
    id: 'doc_002',
    name: 'NDPR Compliance Filing - Q2 2026.pdf',
    category: 'compliance_filing',
    uploadedAt: '2026-07-10T00:00:00.000Z',
    sizeLabel: '1.2 MB',
  },
  {
    id: 'doc_003',
    name: 'Escrow Service Provider Agreement.pdf',
    category: 'legal_agreement',
    uploadedAt: '2026-05-15T00:00:00.000Z',
    sizeLabel: '780 KB',
  },
  {
    id: 'doc_004',
    name: 'Monthly Platform Transparency Report - July 2026.pdf',
    category: 'report',
    uploadedAt: '2026-08-01T00:00:00.000Z',
    sizeLabel: '2.1 MB',
  },
  {
    id: 'doc_005',
    name: 'AML/KYC Verification Policy v2.0.pdf',
    category: 'policy',
    uploadedAt: '2026-04-20T00:00:00.000Z',
    sizeLabel: '390 KB',
  },
];

type CategoryFilter = 'all' | AdminDocument['category'];

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');

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
      setDocuments(mockDocuments);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || d.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'policy', label: 'Policies' },
    { value: 'compliance_filing', label: 'Compliance' },
    { value: 'legal_agreement', label: 'Legal' },
    { value: 'report', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Platform policies, compliance filings, and legal agreements, {documents.length}{' '}
                  file
                  {documents.length === 1 ? '' : 's'}
                </p>
              </div>
              <Button variant="primary" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto">
                {categoryFilters.map((option) => (
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
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <FolderOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No documents found</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 flex-shrink-0">
                      <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {categoryLabels[doc.category]}
                      </p>
                    </div>
                    <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
                    </div>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#c4a747] hover:bg-gray-100 dark:hover:bg-white/10 flex-shrink-0"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
