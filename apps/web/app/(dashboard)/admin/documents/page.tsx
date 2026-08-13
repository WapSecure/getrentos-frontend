'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DocumentUploadDialog,
  type UploadedDocumentData,
} from '@/components/ui/DocumentUploadDialog';
import { DocumentRowActions } from '@/components/ui/DocumentRowActions';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
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

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: adminKeys.documents(),
    queryFn: () => unwrap(adminService.listDocuments()),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: UploadedDocumentData) =>
      unwrap(
        adminService.uploadDocument(
          data.name,
          data.category as AdminDocument['category'],
          data.file
        )
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.documents() }),
  });

  const handleUpload = (data: UploadedDocumentData) => uploadMutation.mutate(data);

  const handleDownload = async (id: string) => {
    const response = await adminService.getDocumentDownloadUrl(id);
    if (response.success && response.data) {
      window.open(response.data.url, '_blank');
    }
  };

  const filteredDocuments = useMemo(
    () =>
      documents.filter((d) => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || d.category === filter;
        return matchesSearch && matchesFilter;
      }),
    [documents, searchQuery, filter]
  );

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
            Platform policies, compliance filings, and legal agreements, {documents.length} file
            {documents.length === 1 ? '' : 's'}
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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {categoryFilters.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
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
      ) : filteredDocuments.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found" />
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {filteredDocuments.map((doc) => (
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
              <DocumentRowActions showShare={false} onDownload={() => handleDownload(doc.id)} />
            </div>
          ))}
        </div>
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
