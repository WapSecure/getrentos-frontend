import { activeConsent, idNumberOk, pendingChecks, purposeFor, digitsOnly } from '@/lib/api/trust';

const step = (stepType: string, status: string) => ({
  id: stepType,
  stepType,
  status,
  attempts: 0,
});

describe('trust verification helpers', () => {
  it('maps each workspace to its onboarding policy', () => {
    expect(purposeFor('landlord')).toBe('LANDLORD_ONBOARDING');
    expect(purposeFor('owner')).toBe('PROPERTY_OWNER_ONBOARDING');
    expect(purposeFor('realtor')).toBe('AGENT_ONBOARDING');
    expect(purposeFor('agent')).toBe('AGENT_ONBOARDING');
    expect(purposeFor('manager')).toBe('PROPERTY_MANAGER_ONBOARDING');
    expect(purposeFor('buyer')).toBe('RENTER_ONBOARDING');
    expect(purposeFor(null)).toBe('RENTER_ONBOARDING');
  });

  it('groups the biometric steps into one check and skips finished ones', () => {
    expect(
      pendingChecks([
        step('PHONE_OTP', 'PASSED'),
        step('NIN_CHECK', 'FAILED'),
        step('SELFIE_CAPTURE', 'NOT_STARTED'),
        step('LIVENESS_CHECK', 'NOT_STARTED'),
        step('FACE_MATCH', 'NOT_STARTED'),
        step('BANK_ACCOUNT_CHECK', 'WAITING_FOR_PROVIDER'),
        step('AML_CHECK', 'NOT_STARTED'),
      ])
    ).toEqual(['identity', 'biometric']);
  });

  it('only counts consents that are neither revoked nor expired', () => {
    const now = Date.parse('2026-11-05T00:00:00Z');
    const consents = [
      { id: 'a', consentType: 'ID_CHECK', grantedAt: '', revokedAt: '2026-11-01' },
      { id: 'b', consentType: 'ID_CHECK', grantedAt: '', expiresAt: '2026-10-01' },
      { id: 'c', consentType: 'BIOMETRIC', grantedAt: '', expiresAt: '2027-10-01' },
    ];
    expect(activeConsent(consents, 'ID_CHECK', now)).toBeUndefined();
    expect(activeConsent(consents, 'BIOMETRIC', now)?.id).toBe('c');
  });

  it('wants 11 digits for NIN and BVN', () => {
    expect(idNumberOk('NIN', '1234567890')).toBe(false);
    expect(idNumberOk('BVN', '12345678901')).toBe(true);
    expect(idNumberOk('PASSPORT', 'A123')).toBe(true);
    expect(digitsOnly('12-34 5a', 4)).toBe('1234');
  });
});
