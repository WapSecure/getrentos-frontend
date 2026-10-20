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
  Users,
} from 'lucide-react';
import {
  Badge,
  Card,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  type BadgeVariant,
} from '@getrentos/ui';
import { DocumentPreviewModal } from './DocumentPreviewModal';

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
  lease: { icon: FileCheck, color: 'text-info' },
  receipt: { icon: FileText, color: 'text-success' },
  inspection: { icon: File, color: 'text-primary' },
  other: { icon: Shield, color: 'text-muted-foreground' },
};

const statusVariants: Record<Document['status'], BadgeVariant> = {
  active: 'success',
  expiring: 'warning',
  expired: 'danger',
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
  const [showPreview, setShowPreview] = useState(false);

  const TypeIcon = typeIcons[document.type as keyof typeof typeIcons]?.icon || FileText;
  const typeColor =
    typeIcons[document.type as keyof typeof typeIcons]?.color || 'text-muted-foreground';

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleFavoriteClick = () => {
    onToggleFavorite(document.id);
  };

  const handleDownloadClick = () => {
    onDownload(document.id);
  };

  const favoriteButton = (
    <IconButton
      label={document.isFavorite ? 'Remove favorite' : 'Add favorite'}
      size="sm"
      aria-pressed={document.isFavorite}
      onClick={handleFavoriteClick}
      icon={
        document.isFavorite ? <Star className="fill-primary text-primary" /> : <StarOff />
      }
    />
  );

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={`More actions for ${document.name}`} size="sm" icon={<MoreVertical />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onSelect={() => onShare(document.id)}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onDelete(document.id)}
          className="text-destructive hover:bg-destructive-subtle focus:bg-destructive-subtle"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const selectBox = onSelect && (
    <Checkbox
      checked={isSelected}
      onCheckedChange={() => onSelect()}
      aria-label={`Select ${document.name}`}
    />
  );

  if (viewMode === 'list') {
    return (
      <>
        <div className="flex items-center justify-between gap-3 border-b border-border p-3 transition-colors hover:bg-secondary">
          <div className="flex min-w-0 items-center gap-3">
            {selectBox}
            <div className={`rounded-lg bg-secondary p-2 ${typeColor}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-foreground">{document.name}</p>
                <Badge variant={statusVariants[document.status]}>{document.status}</Badge>
                {document.isFavorite && <Star className="h-3 w-3 fill-primary text-primary" />}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{document.category}</span>
                <span>•</span>
                <span>{document.size}</span>
                <span>•</span>
                <span>v{document.version}</span>
                {document.sharedWith && document.sharedWith.length > 0 && (
                  <>
                    <span>•</span>
                    <Users className="h-3 w-3" />
                    <span>{document.sharedWith.length}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {favoriteButton}
            <IconButton label="Preview" size="sm" icon={<Eye />} onClick={handlePreview} />
            <IconButton
              label="Download"
              size="sm"
              icon={<Download />}
              onClick={handleDownloadClick}
            />
            {actionsMenu}
          </div>
        </div>

        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          document={document}
        />
      </>
    );
  }

  // Grid view
  return (
    <>
      <Card hover selected={isSelected} className="group">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {selectBox}
              <div className={`rounded-lg bg-secondary p-2 ${typeColor}`}>
                <TypeIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              {favoriteButton}
              {actionsMenu}
            </div>
          </div>

          <h4 className="mt-3 line-clamp-1 font-medium text-foreground">{document.name}</h4>

          <p className="mt-0.5 text-xs text-muted-foreground">{document.category}</p>

          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Uploaded {formatDate(document.uploadedAt)}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{document.size}</span>
            <span>•</span>
            <span>v{document.version}</span>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {document.tags.slice(0, 2).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
              {document.tags.length > 2 && <Badge>+{document.tags.length - 2}</Badge>}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <Badge variant={statusVariants[document.status]}>{document.status}</Badge>
            {document.sharedWith && document.sharedWith.length > 0 && (
              <Users className="h-3 w-3 text-muted-foreground" />
            )}
            <div className="flex-1" />
            <IconButton label="Preview" size="sm" icon={<Eye />} onClick={handlePreview} />
            <IconButton
              label="Download"
              size="sm"
              icon={<Download />}
              onClick={handleDownloadClick}
            />
          </div>
        </div>
      </Card>

      <DocumentPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        document={document}
      />
    </>
  );
};
