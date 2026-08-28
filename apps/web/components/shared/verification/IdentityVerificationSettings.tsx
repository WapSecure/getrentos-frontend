'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle, FileText, Check } from 'lucide-react';
import { Button, Select } from '@getrentos/ui';
import {
  kycService,
  IDENTITY_DOCUMENT_TYPES,
  type IdentityDocumentType,
} from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';

const DOCUMENT_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  NATIONAL_ID: 'National ID',
  PASSPORT: 'International Passport',
  DRIVERS_LICENSE: "Driver's License",
  VOTERS_CARD: "Voter's Card",
  NIN: 'NIN Slip',
  BVN: 'BVN',
};

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  APPROVED: {
    label: 'Verified',
    icon: ShieldCheck,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    icon: ShieldAlert,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  NEEDS_CLARIFICATION: {
    label: 'Needs Clarification',
    icon: HelpCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  REJECTED: {
    label: 'Rejected',
    icon: ShieldX,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
};

interface IdentityVerificationSettingsProps {
  /** Why this matters for the current persona, shown above the form. */
  description?: string;
}

export const IdentityVerificationSettings = ({
  description = 'Verify your identity to unlock actions like submitting applications and offers.',
}: IdentityVerificationSettingsProps) => {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState<IdentityDocumentType>('NATIONAL_ID');
  const [document, setDocument] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      unwrap(
        kycService.submitIdentity({
          documentType,
          document: document!,
          selfie: selfie ?? undefined,
        })
      ),
    onSuccess: () => {
      setDocument(null);
      setSelfie(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to submit your documents.'),
  });

  const identity = status?.identity;
  const config = identity ? statusConfig[identity.status] : undefined;
  const canSubmit =
    !identity || identity.status === 'REJECTED' || identity.status === 'NEEDS_CLARIFICATION';

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading verification status…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Identity Verification</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {config && (
        <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
          <config.icon className={`w-5 h-5 shrink-0 ${config.color}`} />
          <div>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
            {identity?.rejectionReason && (
              <p className="text-xs text-muted-foreground mt-0.5">{identity.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Document type</label>
            <Select
              value={documentType}
              onValueChange={(value) => setDocumentType(value as IdentityDocumentType)}
              options={IDENTITY_DOCUMENT_TYPES.map((type) => ({
                value: type,
                label: DOCUMENT_TYPE_LABELS[type],
              }))}
              ariaLabel="Identity document type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Document photo</label>
            <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
              <LegacyInput
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
              />
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {document?.name || 'Click to upload'}
              </span>
              {document && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Selfie{' '}
              <span className="text-muted-foreground font-normal">
                (speeds up automatic approval)
              </span>
            </label>
            <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
              <LegacyInput
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
              />
              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {selfie?.name || 'Click to upload'}
              </span>
              {selfie && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            variant="primary"
            onClick={() => submitMutation.mutate()}
            disabled={!document || submitMutation.isPending}
            isLoading={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit for Verification'}
          </Button>
        </div>
      )}
    </div>
  );
};
