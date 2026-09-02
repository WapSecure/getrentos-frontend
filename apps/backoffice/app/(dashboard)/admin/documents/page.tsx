'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { DocumentUploadDialog, type UploadedDocumentData } from '@getrentos/ui';
import { DocumentRowActions } from '@getrentos/ui';
import { DocumentPreviewButton } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { formatDate } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { AdminDocument } from '@/types/admin';

const categoryLabels: Record<AdminDocument['category'], string> = {
  policy: 'Policy',
  compliance_filing: 'Compliance Filing',
  legal_agreement: 'Legal Agreement',
  report: 'Report',
};

const categoryOptions = (Object.keys(categoryLabels) as AdminDocument['category'][]).map(
  (value) => ({
    value,
    label: categoryLabels[value],
  })
);

type CategoryFilter = 'all' | AdminDocument['category'];

const PAGE_SIZE = 12;

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.documents({
      search: debouncedSearch,
      category: filter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listDocuments({
          search: debouncedSearch || undefined,
          category: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const documents = data?.items ?? [];
  const total = data?.total ?? 0;

  const uploadMutation = useMutation({
    mutationFn: (data: UploadedDocumentData) =>
      unwrap(
        adminService.uploadDocument(
          data.name,
          data.category as AdminDocument['category'],
          data.file
        )
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'documents'] }),
  });

  const handleUpload = (data: UploadedDocumentData) => uploadMutation.mutate(data);

  const handleDownload = async (id: string) => {
    const response = await adminService.getDocumentDownloadUrl(id);
    if (response.success && response.data) {
      window.open(response.data.url, '_blank');
    }
  };

  const fetchDocUrl = async (id: string): Promise<string | null> => {
    const response = await adminService.getDocumentDownloadUrl(id);
    return response.success && response.data ? response.data.url : null;
  };

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'policy', label: 'Policies' },
    { value: 'compliance_filing', label: 'Compliance' },
    { value: 'legal_agreement', label: 'Legal' },
    { value: 'report', label: 'Reports' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Platform policies, compliance filings, and legal agreements, {total} file
            {total === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
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
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found" />
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
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
                <p className="text-xs text-muted-foreground">{categoryLabels[doc.category]}</p>
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
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={categoryOptions}
        onUpload={handleUpload}
      />
    </>
  );
}
