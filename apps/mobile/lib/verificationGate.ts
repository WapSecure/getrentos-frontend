import { ApiError } from './api/client';

/**
 * What a verification or trust-tier 403 means, in words.
 * Mirrors the web's VerificationRequiredNotice so both apps say the same thing.
 */

const GATE_CODES = [
  'IDENTITY_REQUIRED',
  'LICENSE_REQUIRED',
  'OWNERSHIP_PROOF_REQUIRED',
  'TRUST_TIER_REQUIRED',
] as const;
type GateCode = (typeof GATE_CODES)[number];

const TIER_LABELS: Record<number, string> = {
  0: 'unverified',
  1: 'contact verified',
  2: 'identity verified',
  3: 'financially verified',
  4: 'role verified',
  5: 'trusted actor',
};

export interface GateCopy {
  code: GateCode;
  message: string;
  cta: string;
  /** The trust score, not missing evidence, is what is holding the user back. */
  scoreWithheld: boolean;
}

/** Reads a thrown error as a verification gate, or null when it is some other failure. */
export function readGate(error: unknown): GateCopy | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  const code = error.code as GateCode | undefined;
  if (!code || !GATE_CODES.includes(code)) return null;

  if (code === 'TRUST_TIER_REQUIRED') {
    const { tierRequired = 2, currentTier = 0, reason } = error.details;
    if (reason === 'SCORE_BELOW_TIER3_MIN') {
      // Sending them to verification would be a loop — the checks are done.
      return {
        code,
        scoreWithheld: true,
        message:
          'Your identity and financial checks are complete, but your trust score is below what this needs. Building your trust profile restores access automatically.',
        cta: 'See what your score needs',
      };
    }
    const target =
      tierRequired >= 3
        ? `financial verification (Trust Tier ${tierRequired})`
        : `an identity-verified account (Trust Tier ${tierRequired})`;
    return {
      code,
      scoreWithheld: false,
      message: `You're on Trust Tier ${currentTier} (${TIER_LABELS[currentTier] ?? 'unverified'}). This needs ${target}.`,
      cta: 'Verify now',
    };
  }

  const copy: Record<Exclude<GateCode, 'TRUST_TIER_REQUIRED'>, [string, string]> = {
    IDENTITY_REQUIRED: ['Verify your identity to do this.', 'Verify identity'],
    LICENSE_REQUIRED: ['Verify your realtor or agent licence to do this.', 'Verify licence'],
    OWNERSHIP_PROOF_REQUIRED: [
      'This property needs an approved ownership document first.',
      'Submit ownership proof',
    ],
  };
  const [message, cta] = copy[code];
  return { code, message, cta, scoreWithheld: false };
}
