import { ApiError } from '@/lib/api/client';
import {
  isEmail,
  isPlanLimitError,
  normaliseEmail,
  staffCount,
  staffSetupKeys,
  validateEstateDraft,
  type EstateDraft,
} from '@/lib/api/estateStaffSetup';

const draft = (over: Partial<EstateDraft> = {}): EstateDraft => ({
  name: 'Sunrise Gardens',
  address: '1 Garden Close',
  city: 'Lekki',
  state: 'Lagos',
  gateCount: '1',
  ...over,
});

describe('validateEstateDraft', () => {
  it('trims every field and sends the gate count as a number', () => {
    expect(
      validateEstateDraft(
        draft({ name: '  Sunrise  ', address: ' 1 Close ', city: ' Lekki ', gateCount: ' 3 ' })
      )
    ).toEqual({
      ok: true,
      body: { name: 'Sunrise', address: '1 Close', city: 'Lekki', state: 'Lagos', gateCount: 3 },
    });
  });

  it('leaves the gate count out when it is blank', () => {
    const r = validateEstateDraft(draft({ gateCount: '' }));
    expect(r.ok && r.body).toEqual({
      name: 'Sunrise Gardens',
      address: '1 Garden Close',
      city: 'Lekki',
      state: 'Lagos',
    });
  });

  it('names each missing required field', () => {
    const r = validateEstateDraft(draft({ name: ' ', address: '', city: '', state: '' }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(['address', 'city', 'name', 'state']);
  });

  it.each(['0', '51', '2.5', '-1', 'abc'])('refuses %s gates', (gateCount) => {
    const r = validateEstateDraft(draft({ gateCount }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.gateCount).toMatch(/1 to 50/);
  });

  it.each(['1', '50'])('accepts %s gates', (gateCount) => {
    expect(validateEstateDraft(draft({ gateCount })).ok).toBe(true);
  });
});

describe('isPlanLimitError', () => {
  it('spots the Free-plan estate cap and Pro-only refusals', () => {
    expect(isPlanLimitError(new ApiError('Limit', 403, 'PLAN_LIMIT_REACHED'))).toBe(true);
    expect(isPlanLimitError(new ApiError('Pro', 402, 'PLAN_UPGRADE_REQUIRED'))).toBe(true);
    expect(isPlanLimitError(new ApiError('Pro', 402))).toBe(true);
  });

  it('ignores every other failure', () => {
    expect(isPlanLimitError(new ApiError('Forbidden', 403, 'FORBIDDEN'))).toBe(false);
    expect(isPlanLimitError(new ApiError('Bad', 400))).toBe(false);
    expect(isPlanLimitError(new Error('boom'))).toBe(false);
    expect(isPlanLimitError(undefined)).toBe(false);
  });
});

describe('gateman email', () => {
  it('checks the shape loosely and sends it trimmed and lower-cased', () => {
    expect(isEmail(' Ade@Example.com ')).toBe(true);
    expect(isEmail('ade@example')).toBe(false);
    expect(isEmail('')).toBe(false);
    expect(normaliseEmail(' Ade@Example.COM ')).toBe('ade@example.com');
  });
});

describe('staffCount', () => {
  it('reads naturally', () => {
    expect(staffCount(0)).toBe('No gatemen yet');
    expect(staffCount(1)).toBe('1 gateman');
    expect(staffCount(1200)).toBe('1,200 gatemen');
  });
});

describe('staffSetupKeys', () => {
  it('sits under the estate so an estate-wide invalidation reaches it', () => {
    expect(staffSetupKeys.staff('e1').slice(0, 2)).toEqual(['estate-manager', 'e1']);
  });
});
