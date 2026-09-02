'use client';

import { LegacyInput, Pagination } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen, Search, Check } from 'lucide-react';
import {
  Button,
  DocumentUploadDialog,
  DocumentRowActions,
  DocumentPreviewButton,
  type UploadedDocumentData,
} from '@getrentos/ui';
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

  const { data } = useQuery({
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
        <Button variant="primary" className="gap-2" onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
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
                  {categoryLabels[doc.category]} • {doc.propertyName}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <button
                onClick={() => toggleShare(doc.id)}
                className={`hidden md:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                  doc.sharedWithBuyer
                    ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                    : 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-white/10'
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
