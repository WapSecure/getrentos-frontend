import { offerGap } from '@/lib/api/owner';
import { portalsForRoles, usablePortal } from '@/lib/roles';

describe('owner portal', () => {
  it('opens for property owners', () => {
    expect(usablePortal(['PROPERTY_OWNER'])).toBe('owner');
    // Landlord outranks owner when someone is both.
    expect(portalsForRoles(['PROPERTY_OWNER', 'LANDLORD'])[0]).toBe('landlord');
  });

  it('describes an offer against the asking price', () => {
    expect(offerGap(92_000_000, 100_000_000)).toBe('8% under asking');
    expect(offerGap(105_000_000, 100_000_000)).toBe('5% over asking');
    expect(offerGap(100_000_000, 100_000_000)).toBe('At asking');
    expect(offerGap(1, 0)).toBe('');
  });
});
