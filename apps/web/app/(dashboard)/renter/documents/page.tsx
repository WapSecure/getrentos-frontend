'use client';

import { useState, useEffect } from 'react';
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
import { Toast } from '@/components/ui/Toast';

interface Document {
  id: string;
  name: string;
  type: 'lease' | 'receipt' | 'inspection' | 'other';
  category: string;
  size: string;
  uploadedAt: string;
  updatedAt: string;
  url: string;
  isFavorite: boolean;
  sharedWith?: string[];
  expiryDate?: string;
  version: number;
  status: 'active' | 'expiring' | 'expired';
  tags?: string[];
}

interface UploadData {
  name: string;
  type: string;
  category: string;
  size: string;
  tags: string[];
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const loadDocuments = () => {
    const mockDocuments: Document[] = [
      {
        id: 'doc_001',
        name: 'Lease Agreement - Modern Downtown Loft',
        type: 'lease',
        category: 'Lease Agreements',
        size: '2.4 MB',
        uploadedAt: '2024-02-15',
        updatedAt: '2024-02-15',
        url: '#',
        isFavorite: true,
        version: 1,
        status: 'active',
        tags: ['lease', 'signed'],
      },
      {
        id: 'doc_002',
        name: 'Move-in Inspection Report',
        type: 'inspection',
        category: 'Inspection Reports',
        size: '1.8 MB',
        uploadedAt: '2024-02-28',
        updatedAt: '2024-02-28',
        url: '#',
        isFavorite: false,
        version: 1,
        status: 'active',
        tags: ['inspection', 'move-in'],
      },
      {
        id: 'doc_003',
        name: 'Rent Receipt - March 2024',
        type: 'receipt',
        category: 'Receipts',
        size: '0.5 MB',
        uploadedAt: '2024-03-01',
        updatedAt: '2024-03-01',
        url: '#',
        isFavorite: false,
        version: 1,
        status: 'active',
        tags: ['payment', 'rent'],
      },
      {
        id: 'doc_004',
        name: 'Rent Receipt - April 2024',
        type: 'receipt',
        category: 'Receipts',
        size: '0.5 MB',
        uploadedAt: '2024-04-01',
        updatedAt: '2024-04-01',
        url: '#',
        isFavorite: false,
        version: 1,
        status: 'active',
        tags: ['payment', 'rent'],
      },
      {
        id: 'doc_005',
        name: 'Property Insurance Certificate',
        type: 'other',
        category: 'Insurance',
        size: '1.2 MB',
        uploadedAt: '2024-03-15',
        updatedAt: '2024-03-15',
        url: '#',
        isFavorite: true,
        expiryDate: '2025-03-15',
        version: 1,
        status: 'active',
        tags: ['insurance', 'certificate'],
      },
      {
        id: 'doc_006',
        name: 'Lease Renewal Notice',
        type: 'lease',
        category: 'Lease Agreements',
        size: '1.1 MB',
        uploadedAt: '2024-05-01',
        updatedAt: '2024-05-01',
        url: '#',
        isFavorite: false,
        version: 2,
        status: 'active',
        tags: ['lease', 'renewal'],
      },
      {
        id: 'doc_007',
        name: 'Rent Receipt - May 2024',
        type: 'receipt',
        category: 'Receipts',
        size: '0.5 MB',
        uploadedAt: '2024-05-01',
        updatedAt: '2024-05-01',
        url: '#',
        isFavorite: false,
        version: 1,
        status: 'active',
        tags: ['payment', 'rent'],
      },
      {
        id: 'doc_008',
        name: 'Pet Agreement',
        type: 'other',
        category: 'Miscellaneous',
        size: '0.3 MB',
        uploadedAt: '2024-03-01',
        updatedAt: '2024-03-01',
        url: '#',
        isFavorite: false,
        version: 1,
        status: 'active',
        tags: ['pet', 'agreement'],
      },
    ];
    setDocuments(mockDocuments);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
  }, []);

  const handleUpload = (data: UploadData) => {
    const newDoc: Document = {
      id: `doc_${Date.now()}`,
      name: data.name,
      type: data.type as 'lease' | 'receipt' | 'inspection' | 'other',
      category: data.category,
      size: data.size || '0.5 MB',
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: '#',
      isFavorite: false,
      version: 1,
      status: 'active',
      tags: data.tags || [],
    };
    setDocuments([newDoc, ...documents]);
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
    setSelectedDocuments(selectedDocuments.filter((sid) => sid !== id));
  };

  const handleBulkDelete = () => {
    setDocuments(documents.filter((d) => !selectedDocuments.includes(d.id)));
    setSelectedDocuments([]);
  };

  const handleToggleFavorite = (id: string) => {
    setDocuments(documents.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d)));
  };

  const handleShare = (id: string) => {
    setSharingDocumentId(id);
  };

  const handleConfirmShare = (email: string) => {
    if (!sharingDocumentId) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === sharingDocumentId
          ? { ...d, sharedWith: [...new Set([...(d.sharedWith || []), email])] }
          : d
      )
    );
  };

  const handleDownload = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    setDownloadToast(doc ? `${doc.name} downloaded` : 'Document downloaded');
    window.setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleSelectDocument = (id: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map((d) => d.id));
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tags && doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <DocumentsHeader documentCount={documents.length} onUpload={() => setShowUploadModal(true)} />

      <DocumentsStats documents={documents} />

      <DocumentExpiryAlerts documents={documents} />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <DocumentCategories
            documents={documents}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <DocumentAnalytics documents={documents} />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <DocumentSearch searchTerm={searchTerm} onSearch={setSearchTerm} />

          <DocumentsList
            documents={filteredDocuments}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleSelectDocument}
            onSelectAll={handleSelectAll}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
            onDownload={handleDownload}
          />
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
