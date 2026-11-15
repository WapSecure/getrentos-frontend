import { identityNudgeCopy } from '@/lib/identityNudge';

describe('identity nudge copy', () => {
  it('names what verification unlocks when there is no deadline', () => {
    expect(identityNudgeCopy({ unlocks: 'publishing listings' })).toEqual({
      title: 'Verify your identity',
      detail: 'Unlocks publishing listings: takes two minutes',
      accessibilityLabel: 'Verify your identity. Unlocks publishing listings.',
    });
  });

  it('never promises a deadline the identity gate does not honour', () => {
    const copy = identityNudgeCopy({ unlocks: 'client invites and publishing listings' });
    expect(copy.title).toBe('Verify your identity');
    expect(copy.accessibilityLabel).not.toMatch(/ by /);
  });

  it('leaves the licence card alone', () => {
    const copy = identityNudgeCopy({
      unlocks: 'client work',
      requirement: 'licence',
    });
    expect(copy.title).toBe('Verify your licence');
  });

  it('says a submitted licence is being reviewed instead of asking for it again', () => {
    const copy = identityNudgeCopy({
      unlocks: 'listings and clients',
      requirement: 'licence',
      state: 'pending',
    });
    expect(copy.title).toBe('Your licence is being reviewed');
    expect(copy.detail).toBe('Listings and clients unlock once it is approved. We will let you know.');
  });

  it('asks for a rejected submission to be sent again', () => {
    const copy = identityNudgeCopy({ unlocks: 'publishing listings', state: 'rejected' });
    expect(copy.title).toBe('Your identity check needs another look');
  });
});
