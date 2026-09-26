import { portalsForRoles, usablePortal } from '@/lib/roles';

describe('mobile role routing', () => {
  it.each([
    'BACKOFFICE_ADMIN',
    'VERIFICATION_OFFICER',
    'SUPER_ADMIN',
    'FRAUD_ANALYST',
    'DISPUTE_OFFICER',
    'ESCROW_OFFICER',
    'FINANCE_APPROVER',
    'COMPLIANCE_MANAGER',
    'SUPPORT_AGENT',
  ])('routes %s to the desktop-admin holding experience', (role) => {
    expect(portalsForRoles([role])).toEqual(['admin']);
    expect(usablePortal([role])).toBeNull();
  });

  it('opens the highest-priority implemented portal for a multi-role user', () => {
    expect(usablePortal(['REALTOR', 'AGENT', 'RENTER'])).toBe('agent');
  });
});
