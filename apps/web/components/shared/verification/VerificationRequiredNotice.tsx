import Link from 'next/link';
import { ShieldAlert } from '@sureground/icons';
import { Alert } from '@sureground/ui/Alert';
import {
  VERIFICATION_REASONS,
  TRUST_WITHHELD_REASONS,
  VerificationRequiredError,
  type TrustWithheldReason,
  type VerificationReason,
} from '@/lib/apiHelpers';
import { TIER_LABELS } from './trustTiers';

const BASE_COPY: Record<
  Exclude<VerificationReason, 'TRUST_TIER_REQUIRED'>,
  { message: string; cta: string }
> = {
  IDENTITY_REQUIRED: {
    message: 'Verify your identity to do this.',
    cta: 'Verify identity',
  },
  LICENSE_REQUIRED: {
    message: 'Verify your realtor/agent licence to do this.',
    cta: 'Verify license',
  },
  OWNERSHIP_PROOF_REQUIRED: {
    message: 'This property needs an approved ownership document before it can be listed.',
    cta: 'Submit ownership proof',
  },
};

function tierCopy(tierRequired?: number, currentTier?: number): { message: string; cta: string } {
  const required = tierRequired ?? 2;
  const current = currentTier ?? 0;
  // A tier of 2+ does not prove identity on its own (older approvals), so only name the lower tiers.
  const currentLabel =
    current < 2 ? ` (${(TIER_LABELS[current] ?? `Tier ${current}`).toLowerCase()})` : '';
  const target =
    required >= 3
      ? `financial verification (Trust Tier ${required})`
      : `an identity-verified account (Trust Tier ${required})`;
  return {
    message: `You're on Trust Tier ${current}${currentLabel}. This action needs ${target}. Complete verification to unlock it.`,
    cta: 'Verify now',
  };
}

interface NoticeMeta {
  reason?: VerificationReason;
  tierRequired?: number;
  currentTier?: number;
  withheldReason?: TrustWithheldReason;
}

/** The user already holds the evidence, so sending them to verification would loop: point at the trust profile instead. */
const WITHHELD_COPY: Record<TrustWithheldReason, { message: string; cta: string }> = {
  SCORE_BELOW_TIER3_MIN: {
    message:
      'Your identity and financial checks are complete, but your trust score is below the threshold this action requires. Nothing is wrong with your account: building up your trust profile restores access automatically.',
    cta: 'See what your score needs',
  },
  OPEN_DISPUTE_AS_SUBJECT: {
    message:
      'Your identity and financial checks are complete, but a dispute open against you is holding this back until it is resolved.',
    cta: 'See the dispute holding this',
  },
  OPEN_REVIEW_CASE: {
    message:
      'Your identity and financial checks are complete, but a trust review on your account is still open. This unlocks once that review closes.',
    cta: 'See your trust profile',
  },
  FAILED_FINANCIAL_CHECK: {
    message:
      'An earlier financial check did not pass and has not been cleared since. Re-submit the evidence to restore access.',
    cta: 'See your trust profile',
  },
  ACCOUNT_RESTRICTED: {
    message:
      'Your account is restricted, which holds back actions that need this trust tier. Contact support to resolve it.',
    cta: 'See your trust profile',
  },
};

function readMeta(error: unknown): NoticeMeta | null {
  if (error instanceof VerificationRequiredError) {
    return {
      reason: error.reason,
      tierRequired: error.tierRequired,
      currentTier: error.currentTier,
      withheldReason: error.withheldReason,
    };
  }
  const maybe = error as NoticeMeta | null | undefined;
  if (maybe?.reason && (VERIFICATION_REASONS as readonly string[]).includes(maybe.reason)) {
    return {
      reason: maybe.reason,
      tierRequired: maybe.tierRequired,
      currentTier: maybe.currentTier,
      withheldReason: (TRUST_WITHHELD_REASONS as readonly string[]).includes(
        maybe.withheldReason ?? ''
      )
        ? maybe.withheldReason
        : undefined,
    };
  }
  return null;
}

interface VerificationRequiredNoticeProps {
  error: unknown;
  href: string;
  verificationHref?: string;
  scoreHref?: string;
}

/** Callers use it to show the gate in this notice alone, not also as a toast or field error. */
export function isVerificationGateError(error: unknown): boolean {
  return Boolean(readMeta(error)?.reason);
}

export const VerificationRequiredNotice = ({
  error,
  href,
  verificationHref,
  scoreHref,
}: VerificationRequiredNoticeProps) => {
  const meta = readMeta(error);
  if (!meta?.reason) return null;

  let message: string;
  let cta: string;
  let destination: string;
  if (meta.reason === 'TRUST_TIER_REQUIRED' && meta.withheldReason) {
    const copy = WITHHELD_COPY[meta.withheldReason];
    message = copy.message;
    cta = copy.cta;
    destination = scoreHref ?? verificationHref ?? href;
  } else if (meta.reason === 'TRUST_TIER_REQUIRED') {
    const copy = tierCopy(meta.tierRequired, meta.currentTier);
    message = copy.message;
    cta = copy.cta;
    destination = verificationHref ?? href;
  } else {
    const copy = BASE_COPY[meta.reason];
    message = copy.message;
    cta = copy.cta;
    destination = meta.reason === 'OWNERSHIP_PROOF_REQUIRED' ? href : (verificationHref ?? href);
  }

  return (
    <Alert variant="warning" icon={ShieldAlert}>
      <p>{message}</p>
      <Link
        href={destination}
        className="inline-block mt-1 font-medium text-foreground underline hover:no-underline"
      >
        {cta}
      </Link>
    </Alert>
  );
};
