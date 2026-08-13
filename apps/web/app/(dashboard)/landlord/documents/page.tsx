'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { FileText, Upload, FolderOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentUploadDialog } from '@/components/ui/DocumentUploadDialog';
import { DocumentRowActions } from '@/components/ui/DocumentRowActions';
import { formatDate } from '@/lib/format';

type DocumentCategory =
  | 'lease_agreements'
  | 'ownership_docs'
  | 'escrow_contracts'
  | 'inspection_reports';

interface PortfolioDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  propertyName: string;
  uploadedAt: string;
  sizeLabel: string;
}

const categoryLabels: Record<DocumentCategory, string> = {
  lease_agreements: 'Lease Agreements',
  ownership_docs: 'Ownership Documents',
  escrow_contracts: 'Escrow Contracts',
  inspection_reports: 'Inspection Reports',
};

const mockDocuments: PortfolioDocument[] = [
  {
    id: 'doc_001',
    name: 'Lease Agreement - Adaeze Okafor.pdf',
    category: 'lease_agreements',
    propertyName: 'Sunrise Apartments, Unit 1A',
    uploadedAt: '2025-02-01T00:00:00.000Z',
    sizeLabel: '482 KB',
  },
  {
    id: 'doc_002',
    name: 'Lease Agreement - Chuka Nwosu.pdf',
    category: 'lease_agreements',
    propertyName: 'Sunrise Apartments, Unit 3B',
    uploadedAt: '2024-11-10T00:00:00.000Z',
    sizeLabel: '461 KB',
  },
  {
    id: 'doc_003',
    name: 'Title Deed - Sunrise Apartments.pdf',
    category: 'ownership_docs',
    propertyName: 'Sunrise Apartments',
    uploadedAt: '2024-10-15T00:00:00.000Z',
    sizeLabel: '1.2 MB',
  },
  {
    id: 'doc_004',
    name: 'Certificate of Occupancy - Palm Court.pdf',
    category: 'ownership_docs',
    propertyName: 'Palm Court Residences',
    uploadedAt: '2024-09-01T00:00:00.000Z',
    sizeLabel: '980 KB',
  },
  {
    id: 'doc_005',
    name: 'Escrow Agreement - Unit 1A.pdf',
    category: 'escrow_contracts',
    propertyName: 'Sunrise Apartments, Unit 1A',
    uploadedAt: '2025-02-01T00:00:00.000Z',
    sizeLabel: '210 KB',
  },
  {
    id: 'doc_006',
    name: 'Move-in Inspection - Unit 3B.pdf',
    category: 'inspection_reports',
    propertyName: 'Sunrise Apartments, Unit 3B',
    uploadedAt: '2024-11-10T00:00:00.000Z',
    sizeLabel: '3.4 MB',
  },
];

const categoryFilters: { value: 'all' | DocumentCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lease_agreements', label: 'Leases' },
  { value: 'ownership_docs', label: 'Ownership' },
  { value: 'escrow_contracts', label: 'Escrow' },
  { value: 'inspection_reports', label: 'Inspections' },
];

export default function LandlordDocumentsPage() {
  const [documents, setDocuments] = useState<PortfolioDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | DocumentCategory>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUpload = (data: { name: string; category: string; sizeLabel: string }) => {
    setDocuments((prev) => [
      {
        id: `doc_${Date.now()}`,
        name: data.name,
        category: data.category as DocumentCategory,
        propertyName: 'Unassigned',
        uploadedAt: new Date().toISOString(),
        sizeLabel: data.sizeLabel,
      },
      ...prev,
    ]);
  };

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || d.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} document{documents.length === 1 ? '' : 's'} across your portfolio
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
                  {categoryLabels[doc.category]} • {doc.propertyName}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">
                {formatDate(doc.uploadedAt)} • {doc.sizeLabel}
              </div>
              <DocumentRowActions />
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
