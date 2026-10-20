'use client';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';
import { Alert, Button, CardSkeleton, DocumentUpload, Field, Input } from '@getrentos/ui';
import { kycService } from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  APPROVED: {
    label: 'Verified',
    icon: ShieldCheck,
    color: 'text-success',
    bg: 'bg-success-subtle',
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    icon: ShieldAlert,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  NEEDS_CLARIFICATION: {
    label: 'Needs Clarification',
    icon: HelpCircle,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  REJECTED: {
    label: 'Rejected',
    icon: ShieldX,
    color: 'text-destructive',
    bg: 'bg-destructive-subtle',
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
    return <CardSkeleton lines={3} />;
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
          <Field label="License number" required>
            <Input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="RC-2024-001234"
            />
          </Field>

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
              hint="PDF or image: preview before submitting"
            />
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Button
            variant="primary"
            onClick={() => submitMutation.mutate()}
            disabled={!licenseNumber.trim()}
            isLoading={submitMutation.isPending}
            loadingText="Submitting…"
          >
            Submit for Verification
          </Button>
        </div>
      )}
    </div>
  );
};
