'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { Button, FilePreviewDialog, Skeleton, useToast } from '@getrentos/ui';

export const DocumentChecklist = () => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const toast = useToast();
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
      toast.success('Document uploaded successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload document');
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Your Documents</h3>
              {isLoading ? (
                <Skeleton className="mt-1 h-3 w-28" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {`${uploadedCount} document${uploadedCount === 1 ? '' : 's'} uploaded`}
                </p>
              )}
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="p-4 pt-0 space-y-3">
            {isLoading ? (
              <div role="status" aria-label="Loading documents" className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2 p-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className={index % 2 === 0 ? 'h-3.5 w-2/3' : 'h-3.5 w-1/2'} />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No documents yet. Upload your ID, proof of income and other documents to strengthen
                your applications.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <motion.button
                    key={doc.id}
                    type="button"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setPreviewDoc({ url: doc.url, name: doc.name })}
                    className="flex w-full items-center justify-between p-2 rounded-lg text-left hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate hover:text-primary">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.category} · {doc.size}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploadMutation.isPending}
              loadingText="Uploading…"
              icon={<Upload className="w-3 h-3" />}
              className="border-dashed text-primary"
            >
              Upload a document
            </Button>
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
