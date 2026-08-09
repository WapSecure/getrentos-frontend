'use client';

import { useState } from 'react';
import { LayoutGrid, List, FileText, Check, ArrowDownUp } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { Button } from '@/components/ui/Button';

interface Document {
  id: string;
  name: string;
  type: string;
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

interface DocumentsListProps {
  documents: Document[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  selectedDocuments: string[];
  onSelectDocument: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onShare: (id: string) => void;
  onDownload: (id: string) => void;
}

type SortByType = 'name' | 'date' | 'size';
type SortOrderType = 'asc' | 'desc';

export const DocumentsList = ({
  documents,
  viewMode,
  setViewMode,
  selectedDocuments,
  onSelectDocument,
  onSelectAll,
  onDelete,
  onToggleFavorite,
  onShare,
  onDownload,
}: DocumentsListProps) => {
  const [sortBy, setSortBy] = useState<SortByType>('date');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('desc');

  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      case 'size':
        comparison = parseFloat(a.size) - parseFloat(b.size);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortByType);
  };

  const handleSelectAll = () => {
    onSelectAll();
  };

  const handleViewModeGrid = () => {
    setViewMode('grid');
  };

  const handleViewModeList = () => {
    setViewMode('list');
  };

  if (documents.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground">No documents found</h3>
        <p className="text-muted-foreground mt-2">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="p-1 h-auto">
            <div
              className={`w-4 h-4 rounded border-2 ${selectedDocuments.length === documents.length && documents.length > 0 ? 'bg-primary border-primary' : 'border-border'}`}
            >
              {selectedDocuments.length === documents.length && documents.length > 0 && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
          </Button>
          <div>
            <h3 className="font-semibold text-foreground">All Documents</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {documents.length} documents • {selectedDocuments.length} selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="appearance-none px-3 py-1.5 pr-8 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
            </select>
            <ArrowDownUp className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewModeGrid}
              className={`p-1.5 h-auto ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-gray-500'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewModeList}
              className={`p-1.5 h-auto ${viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={
          viewMode === 'grid'
            ? 'p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'divide-y divide-border'
        }
      >
        {sortedDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            viewMode={viewMode}
            isSelected={selectedDocuments.includes(document.id)}
            onSelect={() => onSelectDocument(document.id)}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onShare={onShare}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
};
