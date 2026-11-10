'use client';

import { useState } from 'react';
import { Check, Copy, Facebook, Mail, MessageCircle, Twitter } from '@sureground/icons';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Path on this site, e.g. `/rent/abc`; made absolute when shared. */
  path: string;
  heading?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  title,
  path,
  heading = 'Share property',
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
  const message = `${title} on Sureground: ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const options = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(message)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="pr-8 font-semibold text-foreground">{heading}</DialogTitle>
        <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
          {title}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {options.map((option) => (
              <a
                key={option.name}
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-xl p-2 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 sm:p-3"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <option.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <span className="text-xs text-muted-foreground">{option.name}</span>
              </a>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium text-foreground">Or copy the link</p>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 truncate rounded-lg bg-secondary/60 p-2 text-sm text-muted-foreground">
                {url}
              </div>
              <Button
                variant="outline"
                onClick={copy}
                icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
