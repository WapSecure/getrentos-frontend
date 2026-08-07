'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Mail, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Property } from '@/types/renter';

interface SharePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export const SharePropertyModal = ({ isOpen, onClose, property }: SharePropertyModalProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/renter/properties/${property.id}`
      : '';

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'Message',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () =>
        window.open(
          `sms:?body=${encodeURIComponent(`Check out this property: ${property.title} - ${shareUrl}`)}`,
          '_blank'
        ),
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        ),
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500',
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${property.title} - ${shareUrl}`)}`,
          '_blank'
        ),
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600',
      action: () =>
        (window.location.href = `mailto:?subject=${encodeURIComponent(`Check out this property: ${property.title}`)}&body=${encodeURIComponent(`I found this property on GetRentos: ${shareUrl}`)}`),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Share Property</h3>
                <p className="text-xs text-gray-500 mt-0.5">{property.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Share Options */}
              <div className="grid grid-cols-4 gap-3">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center`}
                    >
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{option.name}</span>
                  </button>
                ))}
              </div>

              {/* Copy Link Section */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Or copy link
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-400 truncate">
                    {shareUrl}
                  </div>
                  <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
