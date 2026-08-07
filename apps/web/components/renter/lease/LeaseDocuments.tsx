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
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Lease Documents</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          All lease-related documents
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
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

      <div className="p-3 border-t border-gray-200 dark:border-white/10">
        <Button variant="ghost" size="sm" fullWidth className="gap-1">
          View All Documents
        </Button>
      </div>
    </motion.div>
  );
};
