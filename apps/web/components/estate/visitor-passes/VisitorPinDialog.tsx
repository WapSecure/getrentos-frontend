'use client';

import { KeyRound } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import type { IssuedVisitorPass } from '@/types/estate';

interface VisitorPinDialogProps {
  pass: IssuedVisitorPass | null;
  onClose: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export const VisitorPinDialog = ({ pass, onClose }: VisitorPinDialogProps) => {
  return (
    <Dialog open={!!pass} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="sm" className="text-center">
        {pass && (
          <>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6" aria-hidden="true" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground mb-1">
              Visitor Pass Issued
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-4">
              For {pass.visitorName}: {pass.unitLabel}
            </DialogDescription>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pass.qrDataUrl}
              alt="Scannable QR code for this visitor pass"
              className="w-40 h-40 mx-auto mb-4 rounded-lg border border-border bg-white"
            />
            <p className="text-4xl font-bold tracking-[0.3em] text-foreground mb-4">{pass.pin}</p>
            <p className="text-xs text-muted-foreground mb-6">
              Show this QR code at the gate, or share the PIN. It expires{' '}
              {formatDate(pass.expiresAt)} and won&apos;t be shown again.
            </p>
            <Button variant="primary" fullWidth onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
