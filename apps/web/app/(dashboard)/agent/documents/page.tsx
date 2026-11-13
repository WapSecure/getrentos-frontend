'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen } from '@sureground/icons';
import {
  Alert,
  Button,
  EmptyState,
  ListSkeleton,
  Pagination,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
  PageHeader,
} from '@sureground/ui';
import { DocumentUploadDialog } from '@sureground/ui';
import { DocumentRowActions } from '@sureground/ui';
import { FilePreviewDialog } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import type { AgentDocument } from '@/types/agent';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { enqueueAgentBinaryOperation } from '@/lib/agentBinaryQueue';
import { isAgentConnectionFailure, requireAgentQueueOwner } from '@/lib/agentQueueOwner';
import { useAgentUser } from '../layout';

const categoryLabels: Record<AgentDocument['category'], string> = {
  inspection_report: 'Inspection report',
  verification_form: 'Verification form',
  id_scan: 'ID scan',
  agreement: 'Agreement',
  other: 'Other',
};

type CategoryFilter = 'all' | AgentDocument['category'];

export default function AgentDocumentsPage() {
  const agent = useAgentUser();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const {
    data: documentsData,
    error,
    isLoading,
  } = useQuery({
    queryKey: [
      ...agentKeys.documents,
      { search: searchQuery, category: filter, page, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        agentService.listDocuments({
          search: searchQuery || undefined,
          category: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const documents = documentsData?.items ?? [];
  const total = documentsData?.total ?? 0;
  const upload = useMutation({
    mutationFn: (payload: Parameters<typeof agentService.uploadDocument>[0]) =>
      unwrap(agentService.uploadDocument(payload, requireAgentQueueOwner(agent?.id))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: agentKeys.documents }),
  });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null);

  const handleUpload = async (data: { name: string; category: string; file: File }) => {
    try {
      await upload.mutateAsync(data);
    } catch (error) {
      if (!isAgentConnectionFailure(error)) throw error;
      await enqueueAgentBinaryOperation(
        'document',
        { name: data.name, category: data.category },
        [data.file],
        agent?.id
      );
      upload.reset();
      toast.info('Document saved on this device. It has not been uploaded yet.');
    }
  };
  const handleDownload = async (id: string) => {
    const file = await unwrap(agentService.getDocumentDownload(id));
    setPreview(file);
  };

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'inspection_report', label: 'Inspections' },
    { value: 'verification_form', label: 'Verifications' },
    { value: 'id_scan', label: 'ID scans' },
    { value: 'agreement', label: 'Agreements' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Work"
        title="Documents"
        description={
          <>
            Inspection reports, verification forms, and agreements, {total} file
            {total === 1 ? '' : 's'}
          </>
        }
        actions={
          <Button
            variant="primary"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => setIsUploadOpen(true)}
          >
            Upload document
          </Button>
        }
      />
      {(error || upload.error) && (
        <Alert variant="danger" className="mb-4">
          Unable to load or upload documents. Please try again.
        </Alert>
      )}

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
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as CategoryFilter);
            setPage(1);
          }}
        >
          <TabsList className="max-w-full">
            {categoryFilters.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} label="Loading documents" />
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
                  {categoryLabels[doc.category]}
                  {doc.relatedTo ? ` • ${doc.relatedTo}` : ''}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <DocumentRowActions
                showShare={false}
                onDownload={() => void handleDownload(doc.id)}
              />
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
      <FilePreviewDialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        file={preview}
      />
    </>
  );
}
