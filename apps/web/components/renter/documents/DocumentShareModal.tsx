'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button, Field, IconButton, Input } from '@getrentos/ui';

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Share Document</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{documentName}</p>
              </div>
              <IconButton
                label="Close share dialog"
                size="sm"
                icon={<X />}
                onClick={onClose}
                disabled={isSharing}
              />
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
