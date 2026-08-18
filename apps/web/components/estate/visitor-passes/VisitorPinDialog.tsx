'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { Button } from '@getrentos/ui';
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
    <AnimatePresence>
      {pass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Visitor Pass Issued</h3>
            <p className="text-sm text-muted-foreground mb-4">
              For {pass.visitorName} — {pass.unitLabel}
            </p>
            <p className="text-4xl font-bold tracking-[0.3em] text-foreground mb-4">{pass.pin}</p>
            <p className="text-xs text-muted-foreground mb-6">
              Share this PIN with the visitor. It expires {formatDate(pass.expiresAt)} and
              won&apos;t be shown again.
            </p>
            <Button variant="primary" fullWidth onClick={onClose}>
              Done
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
