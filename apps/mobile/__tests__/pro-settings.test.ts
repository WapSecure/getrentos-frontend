import { commissionRateOk } from '@/lib/api/realtor';

describe('realtor business preferences', () => {
  it('accepts a whole commission between 1 and 100 percent', () => {
    expect(commissionRateOk(5)).toBe(true);
    expect(commissionRateOk(2.5)).toBe(false);
    expect(commissionRateOk(100)).toBe(true);
    expect(commissionRateOk(0)).toBe(false);
    expect(commissionRateOk(101)).toBe(false);
    expect(commissionRateOk(Number(''))).toBe(false);
    expect(commissionRateOk(Number.NaN)).toBe(false);
  });
});
