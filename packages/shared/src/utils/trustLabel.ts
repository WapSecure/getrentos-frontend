/**
 * One plain-words label for a listing's trust chain, in place of a count like
 * "3/4 trust": renters should not have to work out what a number means.
 *
 * Payment protection is a platform guarantee, so the label turns on the three
 * checks that can actually be outstanding. All done: "Fully verified". One
 * left: say which ("Verified · ownership pending"). More than one: the honest
 * "Verification in progress". Web and mobile both use this, so a listing reads
 * the same everywhere.
 */
export type TrustLabelTone = 'verified' | 'partial' | 'pending';

export interface TrustChainLike {
  steps: { id: string; met: boolean }[];
}

/** What each outstanding check is called in the label. */
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
