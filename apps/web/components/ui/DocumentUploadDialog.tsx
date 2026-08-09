'use client';

import { useState } from 'react';
import { Upload as UploadIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface UploadedDocumentData {
  name: string;
  category: string;
  sizeLabel: string;
}

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { value: string; label: string }[];
  onUpload: (data: UploadedDocumentData) => void;
}

export const DocumentUploadDialog = ({
  open,
  onOpenChange,
  categories,
  onUpload,
}: DocumentUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(categories[0]?.value ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const reset = () => {
    setFile(null);
    setCategory(categories[0]?.value ?? '');
    setIsUploading(false);
    setDragActive(false);
  };

  const handleClose = (next: boolean) => {
    if (!isUploading) reset();
    onOpenChange(next);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      onUpload({
        name: file.name,
        category,
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      reset();
      onOpenChange(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <div className="p-4 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Upload Document</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Add a new document to this list
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              dragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary'
            )}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-xs text-destructive hover:opacity-80"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <UploadIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Drag and drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">or</p>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary hover:opacity-80">Browse files</span>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  PDF, DOC, JPG, PNG up to 10MB
                </p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!file || isUploading}
            isLoading={isUploading}
          >
            <UploadIcon className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
