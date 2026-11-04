import {
  agentPayStatus,
  bankProblem,
  endOfDayLagos,
  hasAccount,
  isPrincipal,
  protectionProblem,
  rateProblem,
  recentMonths,
  setupEditable,
  setupProblem,
  setupToForm,
  splitProblem,
  tokenFrom,
  type Onboarding,
  type PayableAgent,
  type TeamMember,
} from '@/lib/api/agencyFirm';

describe('team', () => {
  const member = (role: TeamMember['role'], userId: string): TeamMember => ({
    userId,
    name: userId,
    email: `${userId}@x.test`,
    role,
    roleLabel: role,
    joinedAt: '',
    expiresAt: null,
    suspendedAt: null,
    state: 'ACTIVE',
  });

  it('knows the principal by the OWNER role', () => {
    const team = [member('OWNER', 'p'), member('STAFF', 's')];
    expect(isPrincipal(team, 'p')).toBe(true);
    expect(isPrincipal(team, 's')).toBe(false);
    expect(isPrincipal(team, undefined)).toBe(false);
  });

  it('ends access at the end of the chosen day in Lagos', () => {
    expect(endOfDayLagos('2026-12-31')).toBe('2026-12-31T22:59:59.000Z');
    expect(endOfDayLagos('')).toBeNull();
  });
});

describe('money', () => {
  it('checks the rate card and splits', () => {
    expect(rateProblem('10', '5')).toBeNull();
    expect(rateProblem('', '5')).toMatch(/both rates/);
    expect(rateProblem('120', '5')).toMatch(/between 0 and 100/);
    expect(splitProblem('40')).toBeNull();
    expect(splitProblem('101')).toMatch(/0 and 100/);
  });

  it('needs a bank code and a 10-digit account number', () => {
    expect(bankProblem('058', '0123456789')).toBeNull();
    expect(bankProblem('5', '0123456789')).toMatch(/bank code/);
    expect(bankProblem('058', '12345')).toMatch(/10 digits/);
  });

  it('reads a blank saved account as none', () => {
    expect(
      hasAccount({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        verified: false,
        payoutHoldUntil: null,
      })
    ).toBe(false);
    expect(hasAccount(null)).toBe(false);
  });

  it('says why an agent can’t be paid, in web’s order', () => {
    const a: PayableAgent = {
      agentUserId: 'a',
      agentName: 'A',
      payable: 1,
      commissions: 1,
      accountSet: true,
      tier: 2,
      payoutHeldUntil: null,
      ready: false,
    };
    expect(agentPayStatus({ ...a, ready: true }).label).toBe('Ready');
    expect(agentPayStatus({ ...a, accountSet: false }).label).toBe('No payout account');
    expect(agentPayStatus({ ...a, payoutHeldUntil: '2026-11-05' }).label).toMatch(/on hold/);
    expect(agentPayStatus(a, 3).label).toBe('Needs ID tier 3');
  });
});

describe('protection and performance', () => {
  it('checks an attestation', () => {
    expect(
      protectionProblem({ schemeName: 'NIESV', effectiveFrom: '2026-11-01', effectiveTo: '' })
    ).toBeNull();
    expect(
      protectionProblem({ schemeName: 'N', effectiveFrom: '2026-11-01', effectiveTo: '' })
    ).toMatch(/Name/);
    expect(
      protectionProblem({
        schemeName: 'NIESV',
        effectiveFrom: '2026-11-01',
        effectiveTo: '2026-10-01',
      })
    ).toMatch(/end before/);
  });

  it('lists recent months newest first', () => {
    const m = recentMonths(3, new Date('2026-11-04T12:00:00Z'));
    expect(m.map((x) => x.value)).toEqual(['2026-11', '2026-10', '2026-09']);
  });
});

describe('firm setup and joining', () => {
  const ok = {
    ...setupToForm(null),
    name: 'Acme Lettings',
    registeredName: 'Acme Lettings Ltd',
    registrationNumber: 'RC 1234567',
    registeredAddress: '1 Marina, Lagos',
    contactEmail: 'hello@acme.test',
    contactPhone: '08000000000',
  };

  it('checks the firm’s details in web’s order and words', () => {
    expect(setupProblem(ok)).toBeNull();
    expect(setupProblem({ ...ok, registrationNumber: '' })).toBe('Enter the CAC number.');
    expect(setupProblem({ ...ok, registrationNumber: 'AB123' })).toMatch(/does not look right/);
    expect(setupProblem({ ...ok, contactPhone: '123' })).toMatch(/phone/);
    expect(setupProblem({ ...ok, contactEmail: 'nope' })).toMatch(/email/);
  });

  it('lets only the principal edit, and only before submission or after a rejection', () => {
    const firm = (isOwner: boolean, kybStatus: Onboarding['profile']['kybStatus']) =>
      ({ isOwner, profile: { kybStatus } }) as Onboarding;
    expect(setupEditable(null)).toBe(true);
    expect(setupEditable(firm(true, 'NOT_SUBMITTED'))).toBe(true);
    expect(setupEditable(firm(true, 'REJECTED'))).toBe(true);
    expect(setupEditable(firm(true, 'SUBMITTED'))).toBe(false);
    expect(setupEditable(firm(false, 'NOT_SUBMITTED'))).toBe(false);
  });

  it('takes the token from a pasted link or the token itself', () => {
    expect(tokenFrom('https://getrentos.com/agency/join?token=abc%2B1&x=2')).toBe('abc+1');
    expect(tokenFrom('  plain-token ')).toBe('plain-token');
  });
});
