'use client';

import { motion } from 'framer-motion';
import { FileText, Download, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{doc.type}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="px-2">
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="px-2">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <Button variant="ghost" size="sm" fullWidth className="gap-1">
          View All Documents
        </Button>
      </div>
    </motion.div>
  );
};
