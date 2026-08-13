'use client';

import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { FilePreview } from '@/components/ui/FilePreview';
import { Button } from '@/components/ui/Button';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: { url: string; name: string; mimeType?: string } | null;
}

export function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  if (!file) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0" showClose>
        <div className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="truncate text-base font-semibold text-foreground">
            {file.name}
          </DialogTitle>
        </div>
        <div className="p-4">
          <FilePreview key={file.url} url={file.url} name={file.name} mimeType={file.mimeType} />
        </div>
        <div className="border-t border-border p-4">
          <Button
            variant="outline"
            fullWidth
            icon={<Download className="h-4 w-4" />}
            onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
          >
            Download file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
