'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentsHeader } from '@/components/renter/documents/DocumentsHeader';
import { DocumentsStats } from '@/components/renter/documents/DocumentsStats';
import { DocumentsList } from '@/components/renter/documents/DocumentsList';
import { DocumentCategories } from '@/components/renter/documents/DocumentCategories';
import { DocumentSearch } from '@/components/renter/documents/DocumentSearch';
import { DocumentAnalytics } from '@/components/renter/documents/DocumentAnalytics';
import { DocumentExpiryAlerts } from '@/components/renter/documents/DocumentExpiryAlerts';
import { DocumentBulkActions } from '@/components/renter/documents/DocumentBulkActions';
import { DocumentUploadModal } from '@/components/renter/documents/DocumentUploadModal';
import { DocumentShareModal } from '@/components/renter/documents/DocumentShareModal';
import { PageErrorState, PageLoadingState, Pagination, Toast } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type {
  DocumentFilterStatus,
  DocumentFilterType,
} from '@/components/renter/documents/DocumentSearch';

interface UploadData {
  file: File;
  name: string;
  type: string;
  category: string;
  size: string;
  tags: string[];
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<DocumentFilterType>('all');
  const [filterStatus, setFilterStatus] = useState<DocumentFilterStatus>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');

  const documentParams = {
    page,
    pageSize: PAGE_SIZE,
    search: searchTerm || undefined,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    type: filterType === 'all' ? undefined : filterType,
    status: filterStatus === 'all' ? undefined : filterStatus,
    sortBy,
    sortOrder: 'desc' as const,
  };
  const documentsQuery = useQuery({
    queryKey: [...renterKeys.documents, documentParams],
    queryFn: () => unwrap(renterService.listDocuments(documentParams)),
  });
  const summaryQuery = useQuery({
    queryKey: renterKeys.documentSummary,
    queryFn: () => unwrap(renterService.getDocumentSummary()),
  });
  const documentsData = documentsQuery.data;
  const documentSummary = summaryQuery.data;
  const documents = documentsData?.items ?? [];
  const total = documentsData?.total ?? 0;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const invalidateDocuments = () => {
    queryClient.invalidateQueries({ queryKey: renterKeys.documents });
    queryClient.invalidateQueries({ queryKey: renterKeys.documentSummary });
  };

  const uploadMutation = useMutation({
    mutationFn: (data: UploadData) =>
      unwrap(
        renterService.uploadDocument(data.file, data.name, data.type, data.category, data.tags)
      ),
    onSuccess: invalidateDocuments,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteDocument(id)),
    onSuccess: (_, id) => {
      invalidateDocuments();
      setSelectedDocuments((prev) => prev.filter((sid) => sid !== id));
      if (documents.length === 1 && page > 1) setPage((current) => current - 1);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => unwrap(renterService.deleteDocument(id)))),
    onSuccess: (_, ids) => {
      invalidateDocuments();
      setSelectedDocuments([]);
      if (
        documents.length > 0 &&
        documents.every((document) => ids.includes(document.id)) &&
        page > 1
      ) {
        setPage((current) => current - 1);
      }
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.toggleDocumentFavorite(id)),
    onSuccess: invalidateDocuments,
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      unwrap(renterService.shareDocument(id, email)),
    onSuccess: invalidateDocuments,
  });

  const handleUpload = (data: UploadData) => uploadMutation.mutate(data);
  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleBulkDelete = () => bulkDeleteMutation.mutate(selectedDocuments);
  const handleToggleFavorite = (id: string) => toggleFavoriteMutation.mutate(id);

  const handleShare = (id: string) => {
    setSharingDocumentId(id);
  };

  const handleConfirmShare = (email: string) => {
    if (!sharingDocumentId) return;
    shareMutation.mutate({ id: sharingDocumentId, email });
  };

  const handleDownload = async (id: string) => {
    const res = await renterService.getDocumentDownloadUrl(id);
    if (res.success && res.data) {
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
      setDownloadToast(`${res.data.name} downloaded`);
      window.setTimeout(() => setDownloadToast(null), 3000);
    }
  };

  const handleSelectDocument = (id: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const documentIds = documents.map((document) => document.id);
    setSelectedDocuments((previous) =>
      documentIds.every((id) => previous.includes(id))
        ? previous.filter((id) => !documentIds.includes(id))
        : Array.from(new Set([...previous, ...documentIds]))
    );
  };

  const resetPageAndSet = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  if (documentsQuery.isLoading || summaryQuery.isLoading) {
    return <PageLoadingState />;
  }

  if (documentsQuery.isError || summaryQuery.isError) {
    return (
      <PageErrorState
        title="Documents are unavailable"
        description="We could not load your documents and expiry summary. Your files have not been changed."
        onRetry={() => {
          void documentsQuery.refetch();
          void summaryQuery.refetch();
        }}
        isRetrying={documentsQuery.isFetching || summaryQuery.isFetching}
      />
    );
  }

  return (
    <>
      <DocumentsHeader
        documentCount={documentSummary?.total ?? total}
        onUpload={() => setShowUploadModal(true)}
      />

      <DocumentsStats summary={documentSummary} />

      <DocumentExpiryAlerts documents={documents} summary={documentSummary} />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <DocumentCategories
            categories={documentSummary?.categories ?? {}}
            total={documentSummary?.total ?? total}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => resetPageAndSet(setSelectedCategory, category)}
          />
          <DocumentAnalytics summary={documentSummary} />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <DocumentSearch
            searchTerm={searchTerm}
            onSearch={(value) => resetPageAndSet(setSearchTerm, value)}
            filterType={filterType}
            onFilterTypeChange={(value) => resetPageAndSet(setFilterType, value)}
            filterStatus={filterStatus}
            onFilterStatusChange={(value) => resetPageAndSet(setFilterStatus, value)}
          />

          <DocumentsList
            documents={documents}
            total={total}
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortBy={sortBy}
            onSortByChange={(value) => resetPageAndSet(setSortBy, value)}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
            onDownload={handleDownload}
          />

          {total > 0 && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              className="mt-6"
            />
          )}
        </div>
      </div>

      {selectedDocuments.length > 0 && (
        <DocumentBulkActions
          selectedCount={selectedDocuments.length}
          onDelete={handleBulkDelete}
          onShare={() => {
            setDownloadToast(
              `Share links copied for ${selectedDocuments.length} document${selectedDocuments.length === 1 ? '' : 's'}`
            );
            window.setTimeout(() => setDownloadToast(null), 3000);
          }}
          onDownload={() => {
            setDownloadToast(
              `${selectedDocuments.length} document${selectedDocuments.length === 1 ? '' : 's'} downloaded`
            );
            window.setTimeout(() => setDownloadToast(null), 3000);
          }}
          onClearSelection={() => setSelectedDocuments([])}
        />
      )}

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUpload}
      />

      <DocumentShareModal
        isOpen={!!sharingDocumentId}
        onClose={() => setSharingDocumentId(null)}
        documentId={sharingDocumentId || ''}
        documentName={documents.find((d) => d.id === sharingDocumentId)?.name || ''}
        onShare={handleConfirmShare}
      />

      {downloadToast && (
        <Toast message={downloadToast} variant="success" onClose={() => setDownloadToast(null)} />
      )}
    </>
  );
}
