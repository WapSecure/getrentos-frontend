'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Circle,
  Upload,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  uploadUrl?: string;
}

const defaultDocuments: Document[] = [
  { id: '1', name: 'Government ID (NIN/Passport)', required: true, uploaded: false },
  { id: '2', name: 'Proof of Income (Payslip)', required: true, uploaded: false },
  { id: '3', name: 'Bank Statement (3 months)', required: true, uploaded: false },
  { id: '4', name: 'Employment Letter', required: false, uploaded: false },
  { id: '5', name: 'Reference Letter', required: false, uploaded: false },
  { id: '6', name: 'Guarantor Form', required: false, uploaded: false },
];

export const DocumentChecklist = () => {
  const [documents, setDocuments] = useState<Document[]>(defaultDocuments);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('renter_documents');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocuments(JSON.parse(saved));
    }
  }, []);

  const handleUpload = (docId: string) => {
    setIsUploading(docId);
    // Simulate upload
    setTimeout(() => {
      const updated = documents.map((doc) => (doc.id === docId ? { ...doc, uploaded: true } : doc));
      setDocuments(updated);
      localStorage.setItem('renter_documents', JSON.stringify(updated));
      setIsUploading(null);
    }, 1500);
  };

  const completedCount = documents.filter((d) => d.uploaded).length;
  const requiredCount = documents.filter((d) => d.required).length;
  const requiredCompleted = documents.filter((d) => d.required && d.uploaded).length;
  const isReady = requiredCompleted === requiredCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Document Checklist</h3>
            <p className="text-xs text-gray-500">
              {completedCount}/{documents.length} documents uploaded
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Application Readiness</span>
              <span>
                {requiredCompleted}/{requiredCount} required
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(requiredCompleted / requiredCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary"
              >
                <div className="flex items-center gap-2">
                  {doc.uploaded ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p
                      className={`text-sm ${doc.uploaded ? 'text-gray-500 line-through' : 'text-foreground'}`}
                    >
                      {doc.name}
                    </p>
                    {doc.required && <span className="text-xs text-red-500">Required</span>}
                  </div>
                </div>
                {!doc.uploaded && (
                  <button
                    onClick={() => handleUpload(doc.id)}
                    disabled={isUploading === doc.id}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
                  >
                    {isUploading === doc.id ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-3 h-3" />
                        Upload
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Ready Badge */}
          {isReady && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Ready to apply! All required documents uploaded.
                </span>
              </div>
            </motion.div>
          )}

          {/* Warning */}
          {!isReady && requiredCompleted < requiredCount && (
            <div className="mt-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  Upload required documents to increase your chances of approval by 40%
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
