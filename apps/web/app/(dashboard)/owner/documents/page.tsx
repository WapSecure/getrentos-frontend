'use client';

import { useState } from 'react';
import { FileText, Upload, FolderOpen, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DocumentUploadDialog } from '@/components/ui/DocumentUploadDialog';
import { DocumentRowActions } from '@/components/ui/DocumentRowActions';
import { formatDate } from '@/lib/format';
import type { OwnershipTransferDocument } from '@/types/owner';

const categoryLabels: Record<OwnershipTransferDocument['category'], string> = {
  transfer_agreement: 'Transfer Agreement',
  payment_receipt: 'Payment Receipt',
  government_filing: 'Government Filing',
  title_transfer: 'Title Transfer',
};

const mockDocuments: OwnershipTransferDocument[] = [
  {
    id: 'doc_001',
    propertyId: 'oprop_007',
    propertyName: 'Surulere Family Duplex',
    name: 'Deed of Assignment - Surulere Duplex.pdf',
    category: 'transfer_agreement',
    uploadedAt: '2026-06-15T00:00:00.000Z',
    sizeLabel: '1.1 MB',
    sharedWithBuyer: true,
  },
  {
    id: 'doc_002',
    propertyId: 'oprop_007',
    propertyName: 'Surulere Family Duplex',
    name: 'Final Payment Receipt.pdf',
    category: 'payment_receipt',
    uploadedAt: '2026-06-14T00:00:00.000Z',
    sizeLabel: '320 KB',
    sharedWithBuyer: true,
  },
  {
    id: 'doc_003',
    propertyId: 'oprop_007',
    propertyName: 'Surulere Family Duplex',
    name: 'Governor’s Consent Filing.pdf',
    category: 'government_filing',
    uploadedAt: '2026-06-20T00:00:00.000Z',
    sizeLabel: '890 KB',
    sharedWithBuyer: false,
  },
  {
    id: 'doc_004',
    propertyId: 'oprop_001',
    propertyName: 'Ocean View Towers',
    name: 'Title Deed - Ocean View Towers.pdf',
    category: 'title_transfer',
    uploadedAt: '2022-03-12T00:00:00.000Z',
    sizeLabel: '1.4 MB',
    sharedWithBuyer: false,
  },
  {
    id: 'doc_005',
    propertyId: 'oprop_003',
    propertyName: 'Lekki Waterfront Duplex',
    name: 'Certificate of Occupancy.pdf',
    category: 'title_transfer',
    uploadedAt: '2025-06-16T00:00:00.000Z',
    sizeLabel: '760 KB',
    sharedWithBuyer: false,
  },
];

type CategoryFilter = 'all' | OwnershipTransferDocument['category'];

export default function OwnerDocumentsPage() {
  const [documents, setDocuments] = useState<OwnershipTransferDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const toggleShare = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, sharedWithBuyer: !d.sharedWithBuyer } : d))
    );
  };

  const handleUpload = (data: { name: string; category: string; sizeLabel: string }) => {
    setDocuments((prev) => [
      {
        id: `doc_${Date.now()}`,
        propertyId: '',
        propertyName: 'Unassigned',
        name: data.name,
        category: data.category as OwnershipTransferDocument['category'],
        uploadedAt: new Date().toISOString(),
        sizeLabel: data.sizeLabel,
        sharedWithBuyer: false,
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
            Ownership verification and sale transfer documents across your portfolio
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
              <DocumentRowActions onShare={() => toggleShare(doc.id)} />
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
