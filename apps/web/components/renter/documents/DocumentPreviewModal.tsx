'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, FileText, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FilePreview } from '@/components/ui/FilePreview';

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
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{document.name}</h3>
                  <p className="text-xs text-gray-500">{document.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-1.5 rounded-lg hover:bg-secondary"
                >
                  {isFavorite ? (
                    <Star className="w-5 h-5 fill-primary text-primary" />
                  ) : (
                    <StarOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <FilePreview url={document.url} name={document.name} mimeType={document.type} />

              {/* Document Details */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium text-foreground">{document.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium text-foreground capitalize">{document.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Uploaded</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(document.uploadedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      document.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : document.status === 'expiring'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {document.status}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-border">
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
