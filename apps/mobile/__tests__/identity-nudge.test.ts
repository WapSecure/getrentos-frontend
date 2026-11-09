import { identityNudgeCopy } from '@/lib/identityNudge';

describe('identity nudge copy', () => {
  it('names what verification unlocks when there is no deadline', () => {
    expect(identityNudgeCopy({ unlocks: 'publishing listings' })).toEqual({
      title: 'Verify your identity',
      detail: 'Unlocks publishing listings: takes two minutes',
      accessibilityLabel: 'Verify your identity. Unlocks publishing listings.',
    });
  });

  it('gives the grace deadline as a British date', () => {
    const copy = identityNudgeCopy({
      unlocks: 'publishing listings',
      graceEndsAt: '2026-12-07T10:00:00.000Z',
    });
    expect(copy.title).toBe('Verify your identity by 7 Dec 2026');
    expect(copy.accessibilityLabel).toBe(
      'Verify your identity by 7 Dec 2026 to keep publishing listings and receiving payouts.'
    );
  });

  it('leaves the licence card alone', () => {
    const copy = identityNudgeCopy({
      unlocks: 'client work',
      requirement: 'licence',
      graceEndsAt: '2026-12-07T10:00:00.000Z',
    });
    expect(copy.title).toBe('Verify your licence');
  });
});
