'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { Send } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import type { ShortletListing } from '@/types/shortlet';

export function ShortletMessageHostDialog({
  listing,
  onClose,
  onSent,
}: {
  listing: ShortletListing;
  onClose: () => void;
  onSent: () => void;
}) {
  const [text, setText] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const send = useMutation({
    mutationFn: () => unwrap(shortletService.startConversation(listing.id, text.trim())),
    onSuccess: () => onSent(),
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-5">
          <DialogTitle>Message the host</DialogTitle>
          <DialogDescription>Ask about {listing.title} before you book.</DialogDescription>
        </div>
        <div className="space-y-4 border-t border-border p-5">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Hi, is this available on the dates I need?"
            rows={4}
            maxLength={2000}
          />
          <Button
            className="w-full"
            disabled={!text.trim() || send.isPending}
            onClick={() => send.mutate()}
          >
            <Send className="mr-1.5 h-4 w-4" />
            {send.isPending ? 'Sending…' : 'Send message'}
          </Button>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
