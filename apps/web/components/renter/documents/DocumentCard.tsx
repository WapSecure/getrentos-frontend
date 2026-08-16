'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Star,
  StarOff,
  MoreVertical,
  Trash2,
  Eye,
  Clock,
  File,
  FileCheck,
  Shield,
  Tag,
  Users,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentShareModal } from './DocumentShareModal';

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

interface DocumentCardProps {
  document: Document;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onShare: (id: string) => void;
  onDownload: (id: string) => void;
}

const typeIcons = {
  lease: { icon: FileCheck, color: 'text-blue-500' },
  receipt: { icon: FileText, color: 'text-green-500' },
  inspection: { icon: File, color: 'text-purple-500' },
  other: { icon: Shield, color: 'text-gray-500' },
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  expiring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const DocumentCard = ({
  document,
  viewMode = 'grid',
  isSelected = false,
  onSelect,
  onDelete,
  onToggleFavorite,
  onShare,
  onDownload,
}: DocumentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const TypeIcon = typeIcons[document.type as keyof typeof typeIcons]?.icon || FileText;
  const typeColor = typeIcons[document.type as keyof typeof typeIcons]?.color || 'text-gray-500';

  const handleToggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleShareClick = () => {
    setShowShareModal(true);
    setShowMenu(false);
  };

  const handleDeleteClick = () => {
    onDelete(document.id);
    setShowMenu(false);
  };

  const handleFavoriteClick = () => {
    onToggleFavorite(document.id);
  };

  const handleDownloadClick = () => {
    onDownload(document.id);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="flex items-center justify-between p-3 hover:bg-secondary transition-colors border-b border-border">
          <div className="flex items-center gap-3">
            {onSelect && (
              <Button variant="ghost" size="sm" onClick={onSelect} className="p-1 h-auto">
                <div
                  className={`w-4 h-4 rounded border-2 ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </Button>
            )}
            <div className={`p-2 rounded-lg bg-secondary ${typeColor}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{document.name}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${statusColors[document.status]}`}
                >
                  {document.status}
                </span>
                {document.isFavorite && <Star className="w-3 h-3 fill-primary text-primary" />}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{document.category}</span>
                <span>•</span>
                <span>{document.size}</span>
                <span>•</span>
                <span>v{document.version}</span>
                {document.sharedWith && document.sharedWith.length > 0 && (
                  <>
                    <span>•</span>
                    <Users className="w-3 h-3" />
                    <span>{document.sharedWith.length}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteClick}
              className="p-1 h-auto"
              title={document.isFavorite ? 'Remove favorite' : 'Add favorite'}
            >
              {document.isFavorite ? (
                <Star className="w-4 h-4 fill-primary text-primary" />
              ) : (
                <StarOff className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              className="p-1 h-auto"
              title="Preview"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadClick}
              className="p-1 h-auto"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-500" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={handleToggleMenu} className="p-1 h-auto">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareClick}
                    className="w-full justify-start px-4 py-2 text-sm text-foreground hover:bg-secondary"
                  >
                    <Share2 className="w-3 h-3 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          document={document}
        />
        <DocumentShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          documentId={document.id}
          documentName={document.name}
          onShare={() => onShare(document.id)}
        />
      </>
    );
  }

  // Grid view
  return (
    <>
      <div
        className={`group bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {onSelect && (
                <Button variant="ghost" size="sm" onClick={onSelect} className="p-0.5 h-auto">
                  <div
                    className={`w-4 h-4 rounded border-2 ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </Button>
              )}
              <div className={`p-2 rounded-lg bg-secondary ${typeColor}`}>
                <TypeIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavoriteClick}
                className="p-1 h-auto"
              >
                {document.isFavorite ? (
                  <Star className="w-4 h-4 fill-primary text-primary" />
                ) : (
                  <StarOff className="w-4 h-4 text-gray-400" />
                )}
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={handleToggleMenu} className="p-1 h-auto">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </Button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShareClick}
                      className="w-full justify-start px-4 py-2 text-sm text-foreground hover:bg-secondary"
                    >
                      <Share2 className="w-3 h-3 mr-2" />
                      Share
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteClick}
                      className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <h4 className="font-medium text-foreground mt-3 line-clamp-1">{document.name}</h4>

          <p className="text-xs text-gray-500 mt-0.5">{document.category}</p>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Uploaded {formatDate(document.uploadedAt)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            <span>{document.size}</span>
            <span>•</span>
            <span>v{document.version}</span>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {document.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {document.tags.length > 2 && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                  +{document.tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[document.status]}`}>
              {document.status}
            </span>
            {document.sharedWith && document.sharedWith.length > 0 && (
              <Users className="w-3 h-3 text-gray-400" />
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              className="p-1.5 h-auto"
              title="Preview"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadClick}
              className="p-1.5 h-auto"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        document={document}
      />
      <DocumentShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={document.id}
        documentName={document.name}
        onShare={() => onShare(document.id)}
      />
    </>
  );
};
