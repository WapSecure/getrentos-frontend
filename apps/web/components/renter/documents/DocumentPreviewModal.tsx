'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, FileText, Star, StarOff } from 'lucide-react';
import {
  Badge,
  Button,
  DescriptionList,
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-2xl w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{document.name}</h3>
                  <p className="text-xs text-muted-foreground">{document.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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

            <div className="p-6">
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
                  className="flex-1 gap-2"
                  onClick={() => window.open(document.url, '_blank', 'noopener,noreferrer')}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
