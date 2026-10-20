'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';

interface DocumentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  onShare: (email: string) => Promise<boolean>;
}

export const DocumentShareModal = ({
  isOpen,
  onClose,
  documentName,
  onShare,
}: DocumentShareModalProps) => {
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [lastSharedWith, setLastSharedWith] = useState<string | null>(null);

  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    setIsSharing(true);
    const shared = await onShare(shareEmail.trim());
    setIsSharing(false);
    if (!shared) return;
    setLastSharedWith(shareEmail.trim());
    setShareEmail('');
    setTimeout(() => setLastSharedWith(null), 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && !isSharing && onClose()}>
      <DialogContent padded={false} showClose={!isSharing}>
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Share Document</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {documentName}
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          {/* Share with Email */}
          <Field
            label="Share with email"
            hint={
              lastSharedWith ? (
                <span className="flex items-center gap-1 text-success">
                  <Check className="h-3 w-3" />
                  Shared with {lastSharedWith}
                </span>
              ) : undefined
            }
          >
            <div className="flex gap-2">
              <Input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email address"
                className="min-w-0 flex-1"
              />
              <Button
                size="sm"
                onClick={() => void handleShare()}
                disabled={!shareEmail.trim() || isSharing}
                isLoading={isSharing}
                loadingText="Sharing"
              >
                Share
              </Button>
            </div>
          </Field>

          <Button variant="primary" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
