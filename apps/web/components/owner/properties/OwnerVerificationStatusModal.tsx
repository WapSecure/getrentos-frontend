'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';
import {
  Alert,
  Button,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Input,
  Select,
} from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { trustService } from '@/services/trustService';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';
import type { LandOwnershipProofInput } from '@/types/land';

interface OwnerVerificationStatusModalProps {
  property: OwnerProperty | null;
  onClose: () => void;
  onResubmit: (propertyId: string, proof: LandOwnershipProofInput) => Promise<void>;
  /** Called after the automated verification verifies the property, so the list refreshes. */
  onVerified?: () => void;
}

const statusConfig: Record<
  OwnershipVerificationStatus,
  { label: string; icon: React.ElementType; bg: string; color: string; message: string }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    bg: 'bg-success-subtle',
    color: 'text-success',
    message:
      'Ownership has been confirmed. This property is eligible for sale listing and ownership transfer.',
  },
  pending_review: {
    label: 'Pending Review',
    icon: ShieldAlert,
    bg: 'bg-warning-subtle',
    color: 'text-warning',
    message:
      'Our compliance team is reviewing your submitted documents. This typically takes 24–48 hours.',
  },
  needs_clarification: {
    label: 'Needs Clarification',
    icon: HelpCircle,
    bg: 'bg-warning-subtle',
    color: 'text-warning',
    message:
      'Additional information or clearer documents are required before we can complete verification.',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    bg: 'bg-destructive-subtle',
    color: 'text-destructive',
    message: 'Verification could not be completed with the documents provided.',
  },
};

export const OwnerVerificationStatusModal = ({
  property,
  onClose,
  onResubmit,
  onVerified,
}: OwnerVerificationStatusModalProps) => {
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<LandOwnershipProofInput['documentType']>('C_OF_O');
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Automated (orchestrated) verification state.
  const [titleDocumentType, setTitleDocumentType] = useState('C_OF_O');
  const [titleDocumentNumber, setTitleDocumentNumber] = useState('');
  const [documentOwnerName, setDocumentOwnerName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [trustError, setTrustError] = useState<string | null>(null);
  const [trustMessage, setTrustMessage] = useState<string | null>(null);

  if (!property) return null;

  const config = statusConfig[property.verificationStatus];
  const Icon = config.icon;
  // Pending properties may need supplemental evidence too. This also gives an
  // owner a safe retry path if one document upload failed after registration.
  const canResubmit = property.verificationStatus !== 'verified';

  /**
   * Runs the orchestrated property verification: address -> title document ->
   * ownership. All three must pass for the property to be verified.
   */
  const handleRunTrustVerification = async () => {
    if (!property) return;
    setIsRunning(true);
    setTrustError(null);
    setTrustMessage(null);
    try {
      // A title document is sensitive evidence: grant the processing consent first.
      await unwrap(trustService.grantConsent({ consentType: 'DOCUMENT_PROCESSING' }));
      const verification = await unwrap(trustService.startPropertyVerification(property.id));

      await unwrap(
        trustService.submitPropertyAddress(verification.id, {
          address: property.address,
          city: property.city,
          state: property.state,
          country: property.country,
        })
      );
      await unwrap(
        trustService.submitPropertyDocument(verification.id, {
          documentType: titleDocumentType,
          documentNumber: titleDocumentNumber.trim(),
          ownerName: (documentOwnerName.trim() || property.ownerName).trim(),
        })
      );
      const ownership = await unwrap(trustService.submitOwnershipCheck(verification.id));
      const detail = await unwrap(trustService.getVerification(verification.id));

      if (detail.decision === 'PASS') {
        setTrustMessage('Property verified: address, title document and ownership all passed.');
        onVerified?.();
      } else {
        setTrustError(
          `Ownership check ${ownership.status.toLowerCase()}. ` +
            (detail.decision === 'REVIEW'
              ? 'The verification was sent for manual review.'
              : 'The name printed on the document must match the owner on record.')
        );
      }
    } catch (reason) {
      setTrustError(reason instanceof Error ? reason.message : 'Unable to run verification.');
    } finally {
      setIsRunning(false);
    }
  };

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">Verification Status</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            {property.name}
          </DialogDescription>
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
            <Alert variant="danger" title="Reviewer note">
              {property.rejectionReason}
            </Alert>
          )}

          <DescriptionList
            layout="rows"
            className="rounded-lg border border-border px-3 [&>div]:py-2"
            items={[
              { label: 'Owner on record', value: property.ownerName },
              ...(typeof property.purchasePrice === 'number'
                ? [{ label: 'Purchase price', value: formatCurrency(property.purchasePrice) }]
                : []),
              ...(property.purchaseDate
                ? [{ label: 'Purchase date', value: formatDate(property.purchaseDate) }]
                : []),
            ]}
          />

          {canResubmit && (
            <div>
              <p className="mb-1 text-sm font-medium text-foreground">
                Upload ownership evidence
              </p>
              <DocumentUpload
                value={resubmitFile ? [{ id: 'file', file: resubmitFile }] : []}
                onChange={(items) => setResubmitFile(items[0]?.file ?? null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple={false}
                label=""
                hint="PDF or image: preview before submitting"
              />
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

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Orchestrated verification: address -> title document -> ownership. */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Automated verification</p>
                <p className="text-xs text-muted-foreground">
                  Runs the address, title-document and ownership checks. Passing all three
                  verifies this property immediately.
                </p>
              </div>
            </div>

            <Select
              value={titleDocumentType}
              onValueChange={setTitleDocumentType}
              options={[
                { value: 'C_OF_O', label: 'Certificate of Occupancy (C of O)' },
                { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
                { value: 'GOVERNORS_CONSENT', label: "Governor's Consent" },
                { value: 'SURVEY_PLAN', label: 'Survey plan' },
                { value: 'RECEIPT', label: 'Government receipt' },
              ]}
              ariaLabel="Title document type"
            />

            <Input
              type="text"
              value={titleDocumentNumber}
              onChange={(e) => setTitleDocumentNumber(e.target.value)}
              placeholder="Document number, e.g. C-OF-O/2026/00123"
              aria-label="Title document number"
            />

            <Input
              type="text"
              value={documentOwnerName}
              onChange={(e) => setDocumentOwnerName(e.target.value)}
              placeholder={`Name printed on the document (e.g. ${property.ownerName})`}
              aria-label="Name printed on the document"
            />

            {trustMessage && <Alert variant="success">{trustMessage}</Alert>}
            {trustError && <Alert variant="danger">{trustError}</Alert>}

            <Button
              variant="primary"
              fullWidth
              onClick={handleRunTrustVerification}
              disabled={titleDocumentNumber.trim().length < 6}
              isLoading={isRunning}
            >
              Run verification
            </Button>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Close
          </Button>
          {canResubmit && (
            <Button
              variant="primary"
              onClick={handleResubmit}
              disabled={!resubmitFile}
              isLoading={isResubmitting}
              loadingText="Submitting…"
              className="flex-1"
            >
              Submit Documents
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
