'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { Toast, ToastVariant, FilePreviewDialog } from '@getrentos/ui';

export const DocumentChecklist = () => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...renterKeys.documents, { page: 1, pageSize: 10 }],
    queryFn: () => unwrap(renterService.listDocuments({ page: 1, pageSize: 10 })),
  });
  const documents = data?.items ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      unwrap(renterService.uploadDocument(file, file.name, 'other', 'application', [])),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.documents });
      setToast({ message: 'Document uploaded successfully', variant: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to upload document', variant: 'error' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  const uploadedCount = data?.total ?? documents.length;

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
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
              <h3 className="font-semibold text-foreground">Your Documents</h3>
              <p className="text-xs text-gray-500">
                {isLoading
                  ? 'Loading…'
                  : `${uploadedCount} document${uploadedCount === 1 ? '' : 's'} uploaded`}
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {documents.length === 0 && !isLoading ? (
              <p className="text-xs text-muted-foreground">
                No documents yet. Upload your ID, proof of income and other documents to strengthen
                your applications.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setPreviewDoc({ url: doc.url, name: doc.name })}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate hover:text-primary">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.category} · {doc.size}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-border text-xs text-primary hover:bg-primary/5 transition-colors"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3" />
                  Upload a document
                </>
              )}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        )}
      </motion.div>

      <FilePreviewDialog
        open={previewDoc !== null}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
        file={previewDoc}
      />
    </>
  );
};
