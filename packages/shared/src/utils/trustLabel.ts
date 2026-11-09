// Payment protection is a platform guarantee, so the label turns only on the three checks that can
// be outstanding.
export type TrustLabelTone = 'verified' | 'partial' | 'pending';

export interface TrustChainLike {
  steps: { id: string; met: boolean }[];
}

const PENDING_NAME: Record<string, string> = {
  owner: 'owner ID pending',
  authority: 'ownership pending',
  property: 'property check pending',
};

export function trustChainLabel(chain: TrustChainLike): { label: string; tone: TrustLabelTone } {
  const outstanding = chain.steps.filter((s) => !s.met && s.id !== 'payment');
  if (outstanding.length === 0) return { label: 'Fully verified', tone: 'verified' };
  if (outstanding.length === 1) {
    const name = PENDING_NAME[outstanding[0].id] ?? 'one check pending';
    return { label: `Verified · ${name}`, tone: 'partial' };
  }
  return { label: 'Verification in progress', tone: 'pending' };
}
