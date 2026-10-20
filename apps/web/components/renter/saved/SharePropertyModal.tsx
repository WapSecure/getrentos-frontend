'use client';

import { useState } from 'react';
import { Copy, Check, Mail, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
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
      action: () =>
        window.open(
          `sms:?body=${encodeURIComponent(`Check out this property: ${property.title} - ${shareUrl}`)}`,
          '_blank'
        ),
    },
    {
      name: 'Facebook',
      icon: Facebook,
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        ),
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${property.title} - ${shareUrl}`)}`,
          '_blank'
        ),
    },
    {
      name: 'Email',
      icon: Mail,
      action: () =>
        (window.location.href = `mailto:?subject=${encodeURIComponent(`Check out this property: ${property.title}`)}&body=${encodeURIComponent(`I found this property on GetRentos: ${shareUrl}`)}`),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle className="pr-8 font-semibold text-foreground">Share Property</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          {property.title}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                type="button"
                onClick={option.action}
                className="flex flex-col items-center gap-2 p-2 sm:p-3 rounded-xl hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <option.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-xs text-muted-foreground">{option.name}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <p className="block text-sm font-medium text-foreground mb-2">Or copy link</p>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 p-2 rounded-lg bg-secondary/60 text-sm text-muted-foreground truncate">
                {shareUrl}
              </div>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
