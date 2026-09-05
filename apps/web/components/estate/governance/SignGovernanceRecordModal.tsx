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
import type { GovernanceRecord } from '@/types/estate';

interface SignGovernanceRecordModalProps {
  record: GovernanceRecord | null;
  onClose: () => void;
  onSign: (recordId: string, signatureData: string) => void;
  isPending?: boolean;
}

export const SignGovernanceRecordModal = ({
  record,
  onClose,
  onSign,
  isPending,
}: SignGovernanceRecordModalProps) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const handleClose = () => {
    setSignatureData(null);
    onClose();
  };

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        {record && (
          <div className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Sign as committee member
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              “{record.title}” requires every committee member to sign. Draw your signature below to
              approve it.
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
                onClick={() => signatureData && onSign(record.id, signatureData)}
              >
                Sign document
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
