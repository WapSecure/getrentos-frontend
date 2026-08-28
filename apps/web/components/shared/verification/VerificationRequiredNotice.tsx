import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { VerificationRequiredError, type VerificationReason } from '@/lib/apiHelpers';

const COPY: Record<VerificationReason, { message: string; cta: string }> = {
  IDENTITY_REQUIRED: {
    message: 'Verify your identity to do this.',
    cta: 'Verify identity',
  },
  LICENSE_REQUIRED: {
    message: 'Verify your realtor/agent license to do this.',
    cta: 'Verify license',
  },
  OWNERSHIP_PROOF_REQUIRED: {
    message: 'This property needs an approved ownership document before it can be listed.',
    cta: 'Submit ownership proof',
  },
};

interface VerificationRequiredNoticeProps {
  /** The caught error from a gated action — renders nothing unless it's a VerificationRequiredError. */
  error: unknown;
  /** Where the notice's link sends the user (the persona's verification settings tab, or the property page). */
  href: string;
}

/** Inline callout shown near a gated action's submit button when it 403s for lack of verification. */
export const VerificationRequiredNotice = ({ error, href }: VerificationRequiredNoticeProps) => {
  if (!(error instanceof VerificationRequiredError)) return null;
  const copy = COPY[error.reason];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
      <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-orange-800 dark:text-orange-300">{copy.message}</p>
        <Link
          href={href}
          className="inline-block mt-1 text-sm font-medium text-orange-700 dark:text-orange-300 underline hover:no-underline"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
};
