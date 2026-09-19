import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  VERIFICATION_REASONS,
  TRUST_WITHHELD_REASONS,
  VerificationRequiredError,
  type TrustWithheldReason,
  type VerificationReason,
} from '@/lib/apiHelpers';

/** Static copy for the per-action verification guards. */
const BASE_COPY: Record<
  Exclude<VerificationReason, 'TRUST_TIER_REQUIRED'>,
  { message: string; cta: string }
> = {
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

const TIER_LABELS: Record<number, string> = {
  0: 'Unverified',
  1: 'Contact verified',
  2: 'Identity verified',
  3: 'Financially verified',
  4: 'Role verified',
  5: 'Trusted actor',
};

/** Builds the copy for the trust-tier guard, tuned to whether tier 2 (identity) or 3+ (financial) is required. */
function tierCopy(tierRequired?: number, currentTier?: number): { message: string; cta: string } {
  const required = tierRequired ?? 2;
  const current = currentTier ?? 0;
  const currentLabel = (TIER_LABELS[current] ?? `Tier ${current}`).toLowerCase();
  const target =
    required >= 3
      ? `financial verification (Trust Tier ${required})`
      : `an identity-verified account (Trust Tier ${required})`;
  return {
    message: `You're on Trust Tier ${current} (${currentLabel}). This action needs ${target}. Complete verification to unlock it.`,
    cta: 'Verify now',
  };
}

interface NoticeMeta {
  reason?: VerificationReason;
  tierRequired?: number;
  currentTier?: number;
  withheldReason?: TrustWithheldReason;
}

/**
 * Copy for a tier requirement that the user already satisfies on evidence but
 * which their trust score is holding back (backend reason
 * SCORE_BELOW_TIER3_MIN). Sending them to verification would be a loop — they
 * are financially verified already — so the CTA points at the score itself.
 */
const SCORE_WITHHELD_COPY: Record<TrustWithheldReason, { message: string; cta: string }> = {
  SCORE_BELOW_TIER3_MIN: {
    message:
      'Your identity and financial checks are complete, but your trust score is below the threshold this action requires. Nothing is wrong with your account — building up your trust profile restores access automatically.',
    cta: 'See what your score needs',
  },
};

/** Accepts either a thrown VerificationRequiredError (unwrap/mutation) or a failed safeCall ApiResponse. */
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
  /** The caught error / failed response from a gated action — renders nothing unless it's a verification/tier gate. */
  error: unknown;
  /** Destination for ownership-proof upsell (the property page). */
  href: string;
  /** Destination for identity/license/trust-tier upsell (the persona's Verification Center). Falls back to `href`. */
  verificationHref?: string;
  /**
   * Destination for the score-withheld upsell (the persona's trust profile,
   * which shows the score breakdown). Falls back to `verificationHref`.
   */
  scoreHref?: string;
}

/** Inline callout shown near a gated action's submit button when it 403s for lack of verification or trust tier. */
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
    const copy = SCORE_WITHHELD_COPY[meta.withheldReason];
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
    // Ownership proof lives on the property page; identity/license are trust upsells.
    destination = meta.reason === 'OWNERSHIP_PROOF_REQUIRED' ? href : (verificationHref ?? href);
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
      <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-orange-800 dark:text-orange-300">{message}</p>
        <Link
          href={destination}
          className="inline-block mt-1 text-sm font-medium text-orange-700 dark:text-orange-300 underline hover:no-underline"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
};
