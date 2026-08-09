'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DocumentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  onShare: (email: string) => void;
}

export const DocumentShareModal = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  onShare,
}: DocumentShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLink, setShareLink] = useState(`https://getrentos.com/share/${documentId}`);
  const [expiryDays, setExpiryDays] = useState(7);
  const [lastSharedWith, setLastSharedWith] = useState<string | null>(null);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!shareEmail.trim()) return;
    onShare(shareEmail.trim());
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
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
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
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button size="sm" onClick={handleShare} disabled={!shareEmail.trim()}>
                    Share
                  </Button>
                </div>
                {lastSharedWith && (
                  <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1.5">
                    <Check className="w-3 h-3" />
                    Shared with {lastSharedWith}
                  </p>
                )}
              </div>

              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Shareable link
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-sm text-muted-foreground truncate">
                    {shareLink}
                  </div>
                  <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Link Settings */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-foreground">Link settings</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Expires after</span>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="px-2 py-1 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </div>

              {/* Security Note */}
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Link is secure and encrypted. Only people with the link can access.
                  </p>
                </div>
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
