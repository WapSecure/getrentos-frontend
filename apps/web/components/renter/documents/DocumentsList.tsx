'use client';

import { LayoutGrid, List, FileText } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { Card, Checkbox, EmptyState, SegmentedControl, Select } from '@getrentos/ui';

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
  total: number;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: SortByType;
  onSortByChange: (sortBy: SortByType) => void;
  selectedDocuments: string[];
  onSelectDocument: (id: string) => void;
  onSelectAll: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onShare: (id: string) => void;
  onDownload: (id: string) => void;
}

type SortByType = 'name' | 'date' | 'size';

export const DocumentsList = ({
  documents,
  total,
  viewMode,
  setViewMode,
  sortBy,
  onSortByChange,
  selectedDocuments,
  onSelectDocument,
  onSelectAll,
  onDelete,
  onToggleFavorite,
  onShare,
  onDownload,
}: DocumentsListProps) => {
  const pageFullySelected =
    documents.length > 0 && documents.every((document) => selectedDocuments.includes(document.id));

  const pagePartlySelected =
    !pageFullySelected && documents.some((document) => selectedDocuments.includes(document.id));

  const handleSortChange = (value: string) => {
    onSortByChange(value as SortByType);
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
      <EmptyState
        icon={FileText}
        title="No documents found"
        description="Upload your first document to get started"
      />
    );
  }

  return (
    <Card>
      <div className="p-4 border-b border-border flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={pageFullySelected}
            indeterminate={pagePartlySelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all documents on this page"
          />
          <div>
            <h3 className="font-semibold text-foreground">All Documents</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {documents.length} of {total} documents • {selectedDocuments.length} selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={handleSortChange}
            ariaLabel="Sort documents"
            controlSize="sm"
            className="w-40"
            options={[
              { value: 'name', label: 'Sort by Name' },
              { value: 'date', label: 'Sort by Date' },
              { value: 'size', label: 'Sort by Size' },
            ]}
          />

          <SegmentedControl
            aria-label="Layout"
            value={viewMode}
            onValueChange={(mode) => (mode === 'grid' ? handleViewModeGrid() : handleViewModeList())}
            iconOnly
            size="sm"
            segments={[
              { value: 'grid', label: 'Grid view', icon: <LayoutGrid /> },
              { value: 'list', label: 'List view', icon: <List /> },
            ]}
          />
        </div>
      </div>

      <div
        className={
          viewMode === 'grid'
            ? 'p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'divide-y divide-border'
        }
      >
        {documents.map((document) => (
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
    </Card>
  );
};
