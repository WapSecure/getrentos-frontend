'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
import { DocumentsHeader } from '@/components/renter/documents/DocumentsHeader';
import { DocumentsStats } from '@/components/renter/documents/DocumentsStats';
import { DocumentsList } from '@/components/renter/documents/DocumentsList';
import { DocumentCategories } from '@/components/renter/documents/DocumentCategories';
import { DocumentSearch } from '@/components/renter/documents/DocumentSearch';
import { DocumentAnalytics } from '@/components/renter/documents/DocumentAnalytics';
import { DocumentExpiryAlerts } from '@/components/renter/documents/DocumentExpiryAlerts';
import { DocumentBulkActions } from '@/components/renter/documents/DocumentBulkActions';
import { DocumentUploadModal } from '@/components/renter/documents/DocumentUploadModal';
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';

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
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      loadDocuments();
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

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
    console.log('Share document:', id);
  };

  const handleDownload = (id: string) => {
    console.log('Download document:', id);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RenterNavbar user={user} />

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <DocumentsHeader
              documentCount={documents.length}
              onUpload={() => setShowUploadModal(true)}
            />

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
          </div>
        </main>
      </div>

      {selectedDocuments.length > 0 && (
        <DocumentBulkActions
          selectedCount={selectedDocuments.length}
          onDelete={handleBulkDelete}
          onShare={() => console.log('Share selected')}
          onDownload={() => console.log('Download selected')}
          onClearSelection={() => setSelectedDocuments([])}
        />
      )}

      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUpload}
      />
    </div>
  );
}
