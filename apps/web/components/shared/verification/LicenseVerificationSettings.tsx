'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle, FileText, Check } from 'lucide-react';
import { Button, DocumentUpload } from '@getrentos/ui';
import { kycService } from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';

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

export const LicenseVerificationSettings = () => {
  const queryClient = useQueryClient();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      unwrap(kycService.submitLicense({ licenseNumber, document: document ?? undefined })),
    onSuccess: () => {
      setLicenseNumber('');
      setDocument(null);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (reason) =>
      setError(reason instanceof Error ? reason.message : 'Unable to submit your license.'),
  });

  const license = status?.license;
  const config = license ? statusConfig[license.status] : undefined;
  const canSubmit =
    !license || license.status === 'REJECTED' || license.status === 'NEEDS_CLARIFICATION';

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading verification status…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">License Verification</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Verify your realtor/agent license to unlock inviting owners and landlords as clients.
        </p>
      </div>

      {config && (
        <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
          <config.icon className={`w-5 h-5 shrink-0 ${config.color}`} />
          <div>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
            {license?.rejectionReason && (
              <p className="text-xs text-muted-foreground mt-0.5">{license.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">License number</label>
            <LegacyInput
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="RC-2024-001234"
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              License document <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <DocumentUpload
              value={document ? [{ id: 'document', file: document }] : []}
              onChange={(items) => setDocument(items[0]?.file ?? null)}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple={false}
              label=""
              hint="PDF or image — preview before submitting"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            variant="primary"
            onClick={() => submitMutation.mutate()}
            disabled={!licenseNumber.trim() || submitMutation.isPending}
            isLoading={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting…' : 'Submit for Verification'}
          </Button>
        </div>
      )}
    </div>
  );
};
