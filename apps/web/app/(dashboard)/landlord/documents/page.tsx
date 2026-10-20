'use client';

import { useState, useEffect } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen } from 'lucide-react';
import {
  Button,
  Pagination,
  DocumentUploadDialog,
  type UploadedDocumentData,
  DocumentRowActions,
  DocumentPreviewButton,
  EmptyState,
  SearchInput,
  Skeleton,
  ToggleChip,
} from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { ListState } from '@/components/shared/ListState';
import { landlordService } from '@/services/landlordService';

type DocumentCategory =
  | 'lease_agreements'
  | 'ownership_docs'
  | 'escrow_contracts'
  | 'inspection_reports';

const categoryLabels: Record<DocumentCategory, string> = {
  lease_agreements: 'Lease Agreements',
  ownership_docs: 'Ownership Documents',
  escrow_contracts: 'Payment protection contracts',
  inspection_reports: 'Inspection Reports',
};

const categoryFilters: { value: 'all' | DocumentCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lease_agreements', label: 'Leases' },
  { value: 'ownership_docs', label: 'Ownership' },
  { value: 'escrow_contracts', label: 'Payment protection' },
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

  const { data, isPending, isError, refetch } = useQuery({
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
    placeholderData: keepPreviousData,
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

  const fetchDocUrl = async (id: string): Promise<string | null> => {
    const response = await landlordService.getDocumentDownloadUrl(id);
    return response.success && response.data ? response.data.url : null;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          {/* Zero is a claim about the portfolio, so wait until it has been read
              before making it. */}
          <p className="text-muted-foreground mt-1">
            {isPending ? (
              <Skeleton className="inline-block h-4 w-56 max-w-full align-middle" />
            ) : (
              `${total} document${total === 1 ? '' : 's'} across your portfolio`
            )}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsUploadOpen(true)}
          icon={<Upload className="w-4 h-4" />}
        >
          Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search documents..."
          className="flex-1 max-w-sm"
        />
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter documents by category">
          {categoryFilters.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      <ListState
        items={documents}
        query={{ isPending, isError, refetch }}
        errorTitle="We couldn't load your documents"
        empty={<EmptyState icon={FolderOpen} title="No documents found" />}
      >
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
              <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <DocumentPreviewButton
                  resolveUrl={() => fetchDocUrl(doc.id)}
                  title="View document"
                />
                <DocumentRowActions showShare={false} onDownload={() => handleDownload(doc.id)} />
              </div>
            </div>
          ))}
        </div>
      </ListState>

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
