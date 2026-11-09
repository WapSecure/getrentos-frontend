'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react';
import { Button, CardSkeleton } from '@sureground/ui';
import { kycService } from '@/services/kycService';
import { unwrap } from '@/lib/apiHelpers';
import { IdentityDocumentFallback } from './IdentityDocumentFallback';

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
    label: 'Pending review',
    icon: ShieldAlert,
    color: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  NEEDS_CLARIFICATION: {
    label: 'Needs clarification',
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

interface IdentityVerificationSettingsProps {
  description?: string;
  verificationHref: string;
}

// The ID-document upload is only a fallback: it never verifies on its own, since a live selfie is still required.
export const IdentityVerificationSettings = ({
  description = 'Verify your identity to unlock actions like submitting applications and offers.',
  verificationHref,
}: IdentityVerificationSettingsProps) => {
  const { data: status, isLoading } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });

  const identity = status?.identity;
  // Verified by NIN counts as approved even while an older document review is pending.
  const verified = status?.identityVerified ?? identity?.status === 'APPROVED';
  const shownStatus = verified ? 'APPROVED' : identity?.status;
  const config = shownStatus ? statusConfig[shownStatus] : undefined;

  if (isLoading) {
    return <CardSkeleton lines={3} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Identity verification</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {config && (
        <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
          <config.icon className={`w-5 h-5 shrink-0 ${config.color}`} />
          <div>
            <p className={`text-sm font-medium ${config.color}`}>{config.label}</p>
            {!verified && identity?.rejectionReason && (
              <p className="text-xs text-muted-foreground mt-0.5">{identity.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {!verified && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Verify with your NIN and a live selfie. It usually takes a few minutes.
          </p>
          <Button
            href={verificationHref}
            icon={<ArrowRight className="h-4 w-4" />}
            iconPosition="right"
          >
            Go to verification
          </Button>
        </div>
      )}

      <IdentityDocumentFallback />
    </div>
  );
};
