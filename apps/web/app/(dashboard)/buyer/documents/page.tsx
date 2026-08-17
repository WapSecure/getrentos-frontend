'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DocumentUploadDialog, type UploadedDocumentData } from '@getrentos/ui';
import { DocumentRowActions } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  const { data: documents = [] } = useQuery({
    queryKey: buyerKeys.documents,
    queryFn: () => unwrap(buyerService.listDocuments()),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: UploadedDocumentData) =>
      buyerService.uploadDocument(data.file, data.name, data.category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buyerKeys.documents }),
  });

  const handleUpload = async (data: UploadedDocumentData) => {
    await uploadMutation.mutateAsync(data);
  };

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || d.category === filter;
    return matchesSearch && matchesFilter;
  });

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
            Your financial documents and purchase records, {documents.length} file
            {documents.length === 1 ? '' : 's'}
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
              onClick={() => setFilter(option.value)}
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

      {filteredDocuments.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
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
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[doc.category]}
                  {doc.propertyTitle ? ` • ${doc.propertyTitle}` : ''}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <DocumentRowActions showShare={false} />
            </div>
          ))}
        </div>
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
