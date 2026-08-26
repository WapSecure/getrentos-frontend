'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ShieldAlert, ShieldX, HelpCircle, Check, FileText } from 'lucide-react';
import { Button, Select } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';
import type { LandOwnershipProofInput } from '@/types/land';

interface OwnerVerificationStatusModalProps {
  property: OwnerProperty | null;
  onClose: () => void;
  onResubmit: (propertyId: string, proof: LandOwnershipProofInput) => Promise<void>;
}

const statusConfig: Record<
  OwnershipVerificationStatus,
  { label: string; icon: React.ElementType; bg: string; color: string; message: string }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    bg: 'bg-green-50 dark:bg-green-900/20',
    color: 'text-green-600 dark:text-green-400',
    message:
      'Ownership has been confirmed. This property is eligible for sale listing and ownership transfer.',
  },
  pending_review: {
    label: 'Pending Review',
    icon: ShieldAlert,
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    color: 'text-yellow-600 dark:text-yellow-400',
    message:
      'Our compliance team is reviewing your submitted documents. This typically takes 24–48 hours.',
  },
  needs_clarification: {
    label: 'Needs Clarification',
    icon: HelpCircle,
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    color: 'text-orange-600 dark:text-orange-400',
    message:
      'Additional information or clearer documents are required before we can complete verification.',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    bg: 'bg-red-50 dark:bg-red-900/20',
    color: 'text-red-600 dark:text-red-400',
    message: 'Verification could not be completed with the documents provided.',
  },
};

export const OwnerVerificationStatusModal = ({
  property,
  onClose,
  onResubmit,
}: OwnerVerificationStatusModalProps) => {
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<LandOwnershipProofInput['documentType']>('C_OF_O');
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!property) return null;

  const config = statusConfig[property.verificationStatus];
  const Icon = config.icon;
  // Pending properties may need supplemental evidence too. This also gives an
  // owner a safe retry path if one document upload failed after registration.
  const canResubmit = property.verificationStatus !== 'verified';

  const handleResubmit = async () => {
    if (!resubmitFile) return;
    setIsResubmitting(true);
    setError(null);
    try {
      await onResubmit(property.id, { documentType, file: resubmitFile });
      setResubmitFile(null);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit the updated document.');
    } finally {
      setIsResubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {property && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">Verification Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{property.name}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="text-center py-4">
                <div
                  className={`w-14 h-14 mx-auto mb-3 rounded-2xl ${config.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-7 h-7 ${config.color}`} />
                </div>
                <h4 className="font-semibold text-foreground">{config.label}</h4>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  {config.message}
                </p>
              </div>

              {property.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                    Reviewer note
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {property.rejectionReason}
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Owner on record</span>
                  <span className="text-foreground font-medium">{property.ownerName}</span>
                </div>
                {typeof property.purchasePrice === 'number' && (
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Purchase price</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(property.purchasePrice)}
                    </span>
                  </div>
                )}
                {property.purchaseDate && (
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Purchase date</span>
                    <span className="text-foreground font-medium">
                      {formatDate(property.purchaseDate)}
                    </span>
                  </div>
                )}
              </div>

              {canResubmit && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Upload ownership evidence
                  </label>
                  <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                    <LegacyInput
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => setResubmitFile(e.target.files?.[0] ?? null)}
                    />
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">
                      {resubmitFile?.name || 'Click to upload'}
                    </span>
                    {resubmitFile && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
                  </label>
                  <div className="mt-3">
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
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Close
              </Button>
              {canResubmit && (
                <Button
                  variant="primary"
                  onClick={handleResubmit}
                  disabled={!resubmitFile || isResubmitting}
                  isLoading={isResubmitting}
                  className="flex-1"
                >
                  {isResubmitting ? 'Submitting…' : 'Submit Documents'}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
