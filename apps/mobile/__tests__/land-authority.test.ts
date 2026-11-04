import { describeCapacityRule, signatoryRolesFor, type LandCapacityRule } from '@getrentos/shared';
import { declareBlocker, isClaim, isEditable } from '@/lib/api/landAuthority';

const rule = (over: Partial<LandCapacityRule> = {}): LandCapacityRule => ({
  label: 'Family representative',
  instruments: ['FAMILY_RESOLUTION'],
  principalRequired: true,
  consentRoles: ['FAMILY_PRINCIPAL'],
  minConsents: 2,
  witnessRequired: true,
  legalInquiryRequired: true,
  ...over,
});

describe('land authority', () => {
  it('tells a claim from the empty view', () => {
    expect(isClaim({ authority: null, rules: {} })).toBe(false);
    expect(isClaim({ authority: { id: 'a' } })).toBe(true);
  });

  it('lets the seller change a claim unless it is disputed, rejected or revoked', () => {
    expect(['DRAFT', 'PENDING_REVIEW', 'VERIFIED'].every(isEditable)).toBe(true);
    expect(['DISPUTED', 'REJECTED', 'REVOKED'].some(isEditable)).toBe(false);
  });

  it('needs a capacity, and the principal when the capacity acts for someone', () => {
    expect(declareBlocker({ capacity: '', principalRequired: false, principalName: '' })).toMatch(
      /how you hold/
    );
    expect(
      declareBlocker({ capacity: 'ATTORNEY', principalRequired: true, principalName: ' ' })
    ).toMatch(/whose authority/);
    expect(
      declareBlocker({ capacity: 'ATTORNEY', principalRequired: true, principalName: 'Ada' })
    ).toBeNull();
  });

  it('describes what a capacity needs and who may consent (shared wording)', () => {
    expect(describeCapacityRule(rule())).toMatch(/family resolution.*at least 2/);
    expect(
      describeCapacityRule(
        rule({
          instruments: [],
          consentRoles: [],
          witnessRequired: false,
          legalInquiryRequired: false,
        })
      )
    ).toMatch(/title documents are enough/);
    expect(signatoryRolesFor(rule())).toEqual(['FAMILY_PRINCIPAL', 'BENEFICIARY']);
  });
});
