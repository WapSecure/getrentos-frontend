'use client';

import { useState } from 'react';
import { FileText, Upload, FolderOpen } from 'lucide-react';
import {
  Button,
  ListSkeleton,
  Pagination,
  QueryState,
  SearchInput,
  SegmentedControl,
} from '@getrentos/ui';
import { DocumentUploadDialog, type UploadedDocumentData } from '@getrentos/ui';
import { DocumentPreviewButton } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerService } from '@/services/buyerService';
import { buyerKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';
import type { BuyerDocument } from '@/types/buyer';

const categoryLabels: Record<BuyerDocument['category'], string> = {
  proof_of_funds: 'Proof of Funds',
  mortgage_preapproval: 'Mortgage Pre-Approval',
  identity: 'Identity Document',
  transfer_agreement: 'Transfer Agreement',
  title_deed: 'Title Deed',
  payment_receipt: 'Payment Receipt',
};

type CategoryFilter = 'all' | BuyerDocument['category'];

export default function BuyerDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const documentsQuery = useQuery({
    queryKey: [
      ...buyerKeys.documents,
      { search: searchQuery, type: filter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        buyerService.listDocuments({
          search: searchQuery || undefined,
          type: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const documentsData = documentsQuery.data;
  const documents = documentsData?.items ?? [];
  const total = documentsData?.total ?? 0;

  const uploadMutation = useMutation({
    mutationFn: (data: UploadedDocumentData) =>
      unwrap(buyerService.uploadDocument(data.file, data.name, data.category)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buyerKeys.documents }),
  });

  const handleUpload = async (data: UploadedDocumentData) => {
    await uploadMutation.mutateAsync(data);
  };

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'proof_of_funds', label: 'Proof of Funds' },
    { value: 'mortgage_preapproval', label: 'Mortgage' },
    { value: 'identity', label: 'Identity' },
    { value: 'transfer_agreement', label: 'Transfer' },
    { value: 'title_deed', label: 'Title Deeds' },
    { value: 'payment_receipt', label: 'Receipts' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Your financial documents and purchase records, {total} file{total === 1 ? '' : 's'}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Upload className="w-4 h-4" />}
          className="w-fit"
          onClick={() => setIsUploadOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search documents..."
          label="Search documents"
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

      <QueryState
        isLoading={documentsQuery.isLoading}
        isError={documentsQuery.isError && !documentsData}
        onRetry={() => void documentsQuery.refetch()}
        isRetrying={documentsQuery.isFetching}
        isEmpty={documents.length === 0}
        empty={{ icon: FolderOpen, title: 'No documents found' }}
        scope="page"
        loading={<ListSkeleton rows={6} />}
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
                  {categoryLabels[doc.category]}
                  {doc.propertyTitle ? ` • ${doc.propertyTitle}` : ''}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {doc.downloadUrl && (
                  <DocumentPreviewButton
                    file={{ url: doc.downloadUrl, name: doc.name }}
                    title="View document"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </QueryState>

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
