'use client';

import {
  Button,
  DocumentPreviewButton,
  DocumentRowActions,
  DocumentUploadDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  SegmentedControl,
  type UploadedDocumentData,
} from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen, Check } from 'lucide-react';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { formatDate } from '@/lib/format';
import type { OwnershipTransferDocument } from '@/types/owner';

const categoryLabels: Record<OwnershipTransferDocument['category'], string> = {
  transfer_agreement: 'Transfer Agreement',
  payment_receipt: 'Payment Receipt',
  government_filing: 'Government Filing',
  title_transfer: 'Title Transfer',
  other: 'Other',
};

/** Owner doc category -> backend OwnerDocumentType enum. */
const CATEGORY_TO_TYPE: Record<string, string> = {
  transfer_agreement: 'TRANSFER_AGREEMENT',
  payment_receipt: 'PAYMENT_RECEIPT',
  government_filing: 'GOVERNMENT_FILING',
  title_transfer: 'TITLE_TRANSFER',
  other: 'OTHER',
};

type CategoryFilter = 'all' | OwnershipTransferDocument['category'];

const PAGE_SIZE = 10;

export default function OwnerDocumentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      ...ownerKeys.documents,
      {
        search: debouncedSearch,
        category: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listDocuments({
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.documents });

  const shareMutation = useMutation({
    mutationFn: ({ id, shared }: { id: string; shared: boolean }) =>
      unwrap(ownerService.toggleDocumentShared(id, shared)),
    onSuccess: invalidate,
  });

  const toggleShare = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) shareMutation.mutate({ id: docId, shared: !doc.sharedWithBuyer });
  };

  const uploadMutation = useMutation({
    mutationFn: (data: UploadedDocumentData) =>
      unwrap(
        ownerService.uploadDocument(
          data.file,
          data.name,
          CATEGORY_TO_TYPE[data.category] ?? 'OTHER'
        )
      ),
    onSuccess: invalidate,
  });

  const handleUpload = async (data: UploadedDocumentData) => {
    await uploadMutation.mutateAsync(data);
  };

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'transfer_agreement', label: 'Transfer Agreements' },
    { value: 'payment_receipt', label: 'Payment Receipts' },
    { value: 'government_filing', label: 'Government Filings' },
    { value: 'title_transfer', label: 'Title Transfer' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {total} document{total === 1 ? '' : 's'} across your portfolio
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
        <SegmentedControl
          size="sm"
          aria-label="Filter by category"
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          segments={categoryFilters}
          className="max-w-full overflow-x-auto"
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} label="Loading documents" />
      ) : isError && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your documents"
          onRetry={() => void refetch()}
        />
      ) : documents.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found" />
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
                  {categoryLabels[doc.category]} • {doc.propertyName}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <button
                type="button"
                onClick={() => toggleShare(doc.id)}
                aria-pressed={doc.sharedWithBuyer}
                disabled={shareMutation.isPending && shareMutation.variables?.id === doc.id}
                className={`hidden md:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
                  doc.sharedWithBuyer
                    ? 'text-success bg-success-subtle'
                    : 'text-muted-foreground bg-secondary'
                }`}
              >
                {doc.sharedWithBuyer && <Check className="w-3 h-3" />}
                {doc.sharedWithBuyer ? 'Shared with Buyer' : 'Not Shared'}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                {doc.downloadUrl && (
                  <DocumentPreviewButton
                    file={{ url: doc.downloadUrl, name: doc.name }}
                    title="View document"
                  />
                )}
                <DocumentRowActions onShare={() => toggleShare(doc.id)} />
              </div>
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
