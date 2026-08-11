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
import { renterService, type RenterDocument as Document } from '@/services/renterService';

interface UploadData {
  file: File;
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

  useEffect(() => {
    const loadDocuments = async () => {
      const res = await renterService.listDocuments();
      if (res.success && res.data) setDocuments(res.data);
    };
    loadDocuments();
  }, []);

  const handleUpload = async (data: UploadData) => {
    const res = await renterService.uploadDocument(
      data.file,
      data.name,
      data.type,
      data.category,
      data.tags
    );
    if (res.success && res.data) {
      const created = res.data;
      setDocuments((prev) => [created, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await renterService.deleteDocument(id);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocuments((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all(selectedDocuments.map((id) => renterService.deleteDocument(id)));
    setDocuments((prev) => prev.filter((d) => !selectedDocuments.includes(d.id)));
    setSelectedDocuments([]);
  };

  const handleToggleFavorite = async (id: string) => {
    const res = await renterService.toggleDocumentFavorite(id);
    if (res.success && res.data) {
      const updated = res.data;
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    }
  };

  const handleShare = (id: string) => {
    setSharingDocumentId(id);
  };

  const handleConfirmShare = async (email: string) => {
    if (!sharingDocumentId) return;
    const res = await renterService.shareDocument(sharingDocumentId, email);
    if (res.success && res.data) {
      const updated = res.data;
      setDocuments((prev) => prev.map((d) => (d.id === sharingDocumentId ? updated : d)));
    }
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
