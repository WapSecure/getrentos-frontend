'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Clock } from 'lucide-react';
import { Button, Card, FilePreviewDialog, IconButton } from '@getrentos/ui';

interface Document {
  name: string;
  type: string;
  uploadedAt: string;
  url: string;
}

interface LeaseDocumentsProps {
  documents: Document[];
}

export const LeaseDocuments = ({ documents }: LeaseDocumentsProps) => {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Lease Documents</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">All lease-related documents</p>
        </div>

        <div className="divide-y divide-border">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 hover:bg-secondary transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{doc.type}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <IconButton
                  size="sm"
                  label={`Preview ${doc.name}`}
                  icon={<Eye />}
                  onClick={() => setPreviewDocument(doc)}
                />
                <IconButton
                  size="sm"
                  label={`Download ${doc.name}`}
                  icon={<Download />}
                  onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" fullWidth className="gap-1">
            View All Documents
          </Button>
        </div>
        <FilePreviewDialog
          open={Boolean(previewDocument)}
          onOpenChange={(open) => !open && setPreviewDocument(null)}
          file={
            previewDocument
              ? {
                  url: previewDocument.url,
                  name: previewDocument.name,
                  mimeType: previewDocument.type,
                }
              : null
          }
        />
      </Card>
    </motion.div>
  );
};
