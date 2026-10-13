'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';

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
              <button
                type="button"
                onClick={onClose}
                disabled={isSharing}
                aria-label="Close share dialog"
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Share with Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Share with email
                </label>
                <div className="flex gap-2">
                  <LegacyInput
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    onClick={() => void handleShare()}
                    disabled={!shareEmail.trim() || isSharing}
                    isLoading={isSharing}
                  >
                    {isSharing ? 'Sharing' : 'Share'}
                  </Button>
                </div>
                {lastSharedWith && (
                  <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1.5">
                    <Check className="w-3 h-3" />
                    Shared with {lastSharedWith}
                  </p>
                )}
              </div>

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
