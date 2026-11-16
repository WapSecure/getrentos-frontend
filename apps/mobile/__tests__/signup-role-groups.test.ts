import {
  ONE_ID_CHECK,
  ROLES,
  SIGNUP_ROLE_GROUPS,
  needsSharedIdNote,
  signupRequirementLines,
} from '@sureground/shared';

describe('sign-up role groups', () => {
  it('lists every self-serve role exactly once', () => {
    const grouped = SIGNUP_ROLE_GROUPS.flatMap((group) => group.roles);
    const publicRoles = Object.values(ROLES)
      .filter((role) => role.canAddLater)
      .map((role) => role.id);
    expect([...grouped].sort()).toEqual([...publicRoles].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('keeps the agreed group order', () => {
    expect(SIGNUP_ROLE_GROUPS.map((group) => [group.title, group.roles])).toEqual([
      ['Find a place', ['renter', 'buyer']],
      ['Own or let property', ['landlord', 'owner']],
      ['Work in property', ['realtor', 'agent', 'estate']],
    ]);
  });

  it('merges requirements per group in plain words', () => {
    expect(signupRequirementLines([])).toEqual([]);
    const lines = signupRequirementLines(['renter', 'buyer', 'landlord', 'realtor']);
    expect(lines.map((line) => line.text)).toEqual([
      'Before you pay or sign: ID check',
      'Before you list or collect rent: ID check, property documents',
      'Before you take on work: ID check, practising licence',
    ]);
    expect(needsSharedIdNote(lines)).toBe(true);
    expect(needsSharedIdNote(signupRequirementLines(['renter']))).toBe(false);
    expect(ONE_ID_CHECK).toBe('One ID check covers all of them.');
  });
});
