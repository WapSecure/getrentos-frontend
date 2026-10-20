'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
  Select,
} from '@getrentos/ui';
import type { Property, VerificationStatus } from '@/types/landlord';
import type { LandOwnershipProofInput } from '@/types/land';

interface LandlordVerificationStatusModalProps {
  property: Property | null;
  onClose: () => void;
  onResubmit: (propertyId: string, proof: LandOwnershipProofInput) => Promise<void>;
}

const statusConfig: Record<
  VerificationStatus,
  { label: string; icon: React.ElementType; bg: string; color: string; message: string }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    bg: 'bg-success-subtle',
    color: 'text-success',
    message: 'Ownership has been confirmed. This property is eligible to be listed for rent.',
  },
  pending: {
    label: 'Pending Review',
    icon: ShieldAlert,
    bg: 'bg-warning-subtle',
    color: 'text-warning',
    message:
      'Our compliance team is reviewing your submitted documents. This typically takes 24–48 hours.',
  },
  unverified: {
    label: 'Unverified',
    icon: ShieldAlert,
    bg: 'bg-secondary',
    color: 'text-muted-foreground',
    message: 'Submit an ownership document to unlock listing this property for rent.',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    bg: 'bg-destructive-subtle',
    color: 'text-destructive',
    message: 'Verification could not be completed with the documents provided. Please resubmit.',
  },
};

export const LandlordVerificationStatusModal = ({
  property,
  onClose,
  onResubmit,
}: LandlordVerificationStatusModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<LandOwnershipProofInput['documentType']>('C_OF_O');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!property) return null;

  const config = statusConfig[property.verificationStatus];
  const Icon = config.icon;
  const canSubmit = property.verificationStatus !== 'verified';

  const handleSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onResubmit(property.id, { documentType, file });
      setFile(null);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit the document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={!!property} onOpenChange={(next) => !next && onClose()}>
      <DialogContent padded={false} className="flex flex-col">
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3 shrink-0">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">
              Ownership Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {property.name}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="text-center py-4">
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-2xl ${config.bg} flex items-center justify-center`}
            >
              <Icon className={`w-7 h-7 ${config.color}`} />
            </div>
            <h4 className="font-semibold text-foreground">{config.label}</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{config.message}</p>
          </div>

          {canSubmit && (
            <div>
              <p className="block text-sm font-medium text-foreground mb-1">
                Upload ownership evidence
              </p>
              <DocumentUpload
                value={file ? [{ id: 'file', file }] : []}
                onChange={(items) => setFile(items[0]?.file ?? null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple={false}
                label=""
                hint="PDF or image: preview before submitting"
              />
              <Field label="Document type" className="mt-3">
                <Select
                  value={documentType}
                  onValueChange={(value) =>
                    setDocumentType(value as LandOwnershipProofInput['documentType'])
                  }
                  options={[
                    { value: 'C_OF_O', label: 'Certificate of Occupancy (C of O)' },
                    { value: 'DEED', label: 'Deed' },
                    { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
                    { value: 'GOVERNOR_CONSENT', label: "Governor's Consent" },
                    { value: 'ALLOCATION_LETTER', label: 'Allocation Letter' },
                    { value: 'EXCISION_GAZETTE', label: 'Excision Gazette' },
                    { value: 'REGISTERED_CONVEYANCE', label: 'Registered Conveyance' },
                    { value: 'SURVEY_PLAN', label: 'Survey plan' },
                    { value: 'LAND_USE_PERMIT', label: 'Land use permit' },
                    {
                      value: 'GOVERNMENT_RECEIPT',
                      label: 'Government receipt / registry extract',
                    },
                    { value: 'OTHER', label: 'Other supporting evidence' },
                  ]}
                  ariaLabel="Ownership proof type"
                />
              </Field>
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="p-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Close
          </Button>
          {canSubmit && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!file}
              isLoading={isSubmitting}
              loadingText="Submitting…"
              className="flex-1"
            >
              Submit Document
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
