'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Button, Pagination } from '@getrentos/ui';
import { DocumentUploadDialog, type UploadedDocumentData } from '@getrentos/ui';
import { DocumentRowActions } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { landlordService } from '@/services/landlordService';

type DocumentCategory =
  | 'lease_agreements'
  | 'ownership_docs'
  | 'escrow_contracts'
  | 'inspection_reports';

const categoryLabels: Record<DocumentCategory, string> = {
  lease_agreements: 'Lease Agreements',
  ownership_docs: 'Ownership Documents',
  escrow_contracts: 'Escrow Contracts',
  inspection_reports: 'Inspection Reports',
};

const categoryFilters: { value: 'all' | DocumentCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lease_agreements', label: 'Leases' },
  { value: 'ownership_docs', label: 'Ownership' },
  { value: 'escrow_contracts', label: 'Escrow' },
  { value: 'inspection_reports', label: 'Inspections' },
];

const PAGE_SIZE = 10;

export default function LandlordDocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | DocumentCategory>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Debounce the search input; reset to page 1 inside the timer callback.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data } = useQuery({
    queryKey: [
      'landlord',
      'documents',
      {
        search: debouncedSearch,
        category: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listDocuments({
          search: debouncedSearch || undefined,
          category: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const documents = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleUpload = async (data: UploadedDocumentData) => {
    const response = await landlordService.uploadDocument(data.name, data.category, data.file);
    if (response.success && response.data) {
      queryClient.invalidateQueries({ queryKey: ['landlord', 'documents'] });
    } else {
      throw new Error(response.message || 'Unable to upload document.');
    }
  };

  const handleDownload = async (id: string) => {
    const response = await landlordService.getDocumentDownloadUrl(id);
    if (response.success && response.data) {
      window.open(response.data.url, '_blank');
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {total} document{total === 1 ? '' : 's'} across your portfolio
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsUploadOpen(true)}>
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
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {categoryFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
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
      </div>

      {documents.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 hover:bg-secondary transition-colors"
            >
              <div className="p-2 rounded-lg bg-secondary shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[doc.category as DocumentCategory]} • {doc.propertyName}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <DocumentRowActions showShare={false} onDownload={() => handleDownload(doc.id)} />
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <DocumentUploadDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        categories={categoryFilters
          .filter((c) => c.value !== 'all')
          .map((c) => ({ value: c.value, label: c.label }))}
        onUpload={handleUpload}
      />
    </>
  );
}
