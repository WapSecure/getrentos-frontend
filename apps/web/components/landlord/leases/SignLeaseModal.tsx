'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  SignaturePad,
} from '@getrentos/ui';
import type { Lease } from '@/types/landlord';

interface SignLeaseModalProps {
  lease: Lease | null;
  onClose: () => void;
  onSign: (leaseId: string, signatureData: string) => void;
  isPending?: boolean;
}

export const SignLeaseModal = ({ lease, onClose, onSign, isPending }: SignLeaseModalProps) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const handleClose = () => {
    setSignatureData(null);
    onClose();
  };

  return (
    <Dialog open={!!lease} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        {lease && (
          <div className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Sign lease
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {lease.propertyName} — {lease.unitName}, tenant {lease.tenantName}. Draw your
              signature below to countersign as landlord.
            </DialogDescription>

            <div className="mt-6">
              <SignaturePad onChange={setSignatureData} width={432} height={150} />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
              <Button type="button" variant="outline" rounded="md" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                rounded="md"
                isLoading={isPending}
                disabled={!signatureData}
                onClick={() => signatureData && onSign(lease.id, signatureData)}
              >
                Sign lease
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
