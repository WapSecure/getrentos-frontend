'use client';

import { useState } from 'react';
import { X, Download, Share2, FileText, Star, StarOff } from 'lucide-react';
import {
  Badge,
  Button,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  FilePreview,
  IconButton,
  type BadgeVariant,
} from '@getrentos/ui';

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
  version: number;
  status: string;
  tags?: string[];
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

const statusVariants: Record<string, BadgeVariant> = {
  active: 'success',
  expiring: 'warning',
};

export const DocumentPreviewModal = ({ isOpen, onClose, document }: DocumentPreviewModalProps) => {
  const [isFavorite, setIsFavorite] = useState(document.isFavorite);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="lg" padded={false} showClose={false}>
        <div className="p-4 border-b border-border flex justify-between items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate font-semibold text-foreground">
                {document.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {document.category}
              </DialogDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <IconButton
              label={isFavorite ? 'Remove favorite' : 'Add favorite'}
              size="sm"
              aria-pressed={isFavorite}
              onClick={() => setIsFavorite(!isFavorite)}
              icon={isFavorite ? <Star className="fill-primary text-primary" /> : <StarOff />}
            />
            <IconButton label="Close" size="sm" icon={<X />} onClick={onClose} />
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <FilePreview url={document.url} name={document.name} mimeType={document.type} />

          {/* Document Details */}
          <DescriptionList
            className="mt-6"
            columns={2}
            items={[
              { label: 'Category', value: document.category },
              { label: 'Type', value: <span className="capitalize">{document.type}</span> },
              { label: 'Uploaded', value: formatDate(document.uploadedAt) },
              {
                label: 'Status',
                value: (
                  <Badge variant={statusVariants[document.status] ?? 'danger'}>
                    {document.status}
                  </Badge>
                ),
              },
            ]}
          />

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
            <Button
              variant="primary"
              className="flex-1"
              icon={<Download className="w-4 h-4" />}
              onClick={() => window.open(document.url, '_blank', 'noopener,noreferrer')}
            >
              Download
            </Button>
            <Button variant="outline" className="flex-1" icon={<Share2 className="w-4 h-4" />}>
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
