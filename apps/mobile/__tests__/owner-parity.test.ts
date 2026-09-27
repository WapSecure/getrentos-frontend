import { planHeadline, type MyBilling } from '@/lib/api/billing';
import { claimOutcome } from '@/lib/api/propertyAuthority';
import { routeForActionUrl } from '@/lib/notificationRoutes';

const base: MyBilling = {
  tier: 'PRO',
  status: 'ACTIVE',
  cycle: 'MONTHLY',
  priceKobo: 1_500_000,
  trialEndsAt: null,
  currentPeriodEnd: '2026-10-27T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  isActive: true,
  trialAvailable: false,
};
const d = (iso: string) => iso.slice(0, 10);

describe('planHeadline', () => {
  it('says when Pro renews, or when it ends once cancelled', () => {
    expect(planHeadline(base, d)).toBe('Pro renews 2026-10-27');
    expect(planHeadline({ ...base, cancelAtPeriodEnd: true }, d)).toBe('Pro until 2026-10-27');
  });

  it('puts a trial end date and a failed payment first', () => {
    expect(
      planHeadline({ ...base, status: 'TRIALING', trialEndsAt: '2026-10-04T00:00:00.000Z' }, d)
    ).toBe('Trial ends 2026-10-04');
    expect(planHeadline({ ...base, status: 'PAST_DUE' }, d)).toMatch(/Payment failed/);
  });

  it('calls a lapsed plan Free', () => {
    expect(planHeadline({ ...base, tier: 'FREE', status: 'CANCELLED', isActive: false }, d)).toBe(
      'Free plan'
    );
  });
});

describe('claimOutcome', () => {
  it('does not announce a new claim when one already existed', () => {
    expect(claimOutcome('ACTIVE')).toMatch(/nothing new was filed/);
    expect(claimOutcome('PENDING')).toMatch(/already have a claim/);
    expect(claimOutcome('REJECTED')).toMatch(/Claim filed/);
  });
});

describe('owner and landlord web links', () => {
  it('open the shared native screens', () => {
    expect(routeForActionUrl('/owner/realtors')).toBe('/(app)/representatives');
    expect(routeForActionUrl('/landlord/billing')).toBe('/(app)/billing');
    expect(routeForActionUrl('/owner/estate-agreements')).toBe('/(app)/estate-agreements');
  });
});
