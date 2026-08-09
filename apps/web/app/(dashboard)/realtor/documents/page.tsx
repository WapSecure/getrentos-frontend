'use client';

import { useState } from 'react';
import { FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentUploadDialog } from '@/components/ui/DocumentUploadDialog';
import { DocumentRowActions } from '@/components/ui/DocumentRowActions';
import { formatDate } from '@/lib/format';
import type { RealtorDocument } from '@/types/realtor';

const categoryLabels: Record<RealtorDocument['category'], string> = {
  agency_agreement: 'Agency Agreement',
  listing_contract: 'Listing Contract',
  closing_document: 'Closing Document',
  license: 'Realtor License',
};

const mockDocuments: RealtorDocument[] = [
  {
    id: 'doc_001',
    name: 'Real Estate Agent License 2026.pdf',
    category: 'license',
    uploadedAt: '2026-01-05T00:00:00.000Z',
    sizeLabel: '310 KB',
  },
  {
    id: 'doc_002',
    name: 'Agency Agreement - Adaeze Okafor.pdf',
    category: 'agency_agreement',
    clientName: 'Adaeze Okafor',
    uploadedAt: '2025-11-10T00:00:00.000Z',
    sizeLabel: '420 KB',
  },
  {
    id: 'doc_003',
    name: 'Listing Contract - Ocean View Towers.pdf',
    category: 'listing_contract',
    clientName: 'Adaeze Okafor',
    uploadedAt: '2026-06-01T00:00:00.000Z',
    sizeLabel: '380 KB',
  },
  {
    id: 'doc_004',
    name: 'Closing Documents - Surulere Duplex.pdf',
    category: 'closing_document',
    clientName: 'Tobi Fashola',
    uploadedAt: '2026-06-14T00:00:00.000Z',
    sizeLabel: '1.1 MB',
  },
];

type CategoryFilter = 'all' | RealtorDocument['category'];

export default function RealtorDocumentsPage() {
  const [documents, setDocuments] = useState<RealtorDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUpload = (data: { name: string; category: string; sizeLabel: string }) => {
    setDocuments((prev) => [
      {
        id: `doc_${Date.now()}`,
        name: data.name,
        category: data.category as RealtorDocument['category'],
        uploadedAt: new Date().toISOString(),
        sizeLabel: data.sizeLabel,
      },
      ...prev,
    ]);
  };

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || d.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categoryFilters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'license', label: 'License' },
    { value: 'agency_agreement', label: 'Agency Agreements' },
    { value: 'listing_contract', label: 'Listing Contracts' },
    { value: 'closing_document', label: 'Closing Documents' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Agency agreements, contracts, and license, {documents.length} file
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
                  {doc.clientName ? ` • ${doc.clientName}` : ''}
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
