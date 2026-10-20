'use client';

import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  FilePreviewDialog,
  Input,
  Select,
} from '@getrentos/ui';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UploadData) => Promise<boolean>;
}

interface UploadData {
  file: File;
  name: string;
  type: string;
  category: string;
  size: string;
  tags: string[];
}

const documentTypes: { value: string; label: string }[] = [
  { value: 'lease', label: 'Lease Agreement' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'inspection', label: 'Inspection Report' },
  { value: 'other', label: 'Other' },
];

const categories: string[] = [
  'Lease Agreements',
  'Receipts',
  'Inspection Reports',
  'Insurance',
  'Miscellaneous',
];

export const DocumentUploadModal = ({ isOpen, onClose, onSubmit }: DocumentUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('lease');
  const [category, setCategory] = useState('Lease Agreements');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string; mimeType: string } | null>(
    null
  );

  const handlePreview = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ url, name: file.name, mimeType: file.type });
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setName(droppedFile.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setName(selectedFile.name);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(60);

    const uploadData: UploadData = {
      file,
      name: name || file.name,
      type,
      category,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      tags: tags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean),
    };
    const uploaded = await onSubmit(uploadData);
    setIsUploading(false);
    if (!uploaded) {
      setProgress(0);
      return;
    }
    setProgress(100);
    onClose();
    setFile(null);
    setName('');
    setTags('');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(next) => !next && !isUploading && onClose()}>
        <DialogContent size="md" padded={false} showClose={!isUploading}>
          <div className="p-4 pr-12 border-b border-border">
            <DialogTitle className="font-semibold text-foreground">Upload Document</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Upload a new document to your vault
            </DialogDescription>
          </div>

          <div className="p-4 space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary'
              }`}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="w-8 h-8 text-primary mx-auto" />
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="xs" onClick={handlePreview}>
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setFile(null)}
                      className="text-destructive hover:bg-destructive-subtle"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag and drop your file here</p>
                  <p className="mt-1 text-xs text-muted-foreground">or</p>
                  <label className="cursor-pointer">
                    <span className="text-sm text-primary hover:text-primary-hover">
                      Browse files
                    </span>
                    <input type="file" onChange={handleFileSelect} className="sr-only" />
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    PDF, DOC, JPG, PNG up to 10MB
                  </p>
                </>
              )}
            </div>

            <div className="space-y-3">
              <Field label="Document Name">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter document name"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Document Type">
                  <Select value={type} onValueChange={setType} options={documentTypes} />
                </Field>

                <Field label="Category">
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    options={categories.map((categoryOption) => ({
                      value: categoryOption,
                      label: categoryOption,
                    }))}
                  />
                </Field>
              </div>

              <Field label="Tags (comma separated)">
                <Input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., important, signed, lease"
                />
              </Field>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={!file || isUploading}
              isLoading={isUploading}
              loadingText="Uploading..."
              icon={<Upload className="h-4 w-4" />}
            >
              Upload Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={preview !== null}
        onOpenChange={(open) => !open && closePreview()}
        file={preview}
      />
    </>
  );
};
