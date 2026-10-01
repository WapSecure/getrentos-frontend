import { portalsForRoles, switchablePortals, usablePortal } from '@/lib/roles';

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
    expect(usablePortal(['REALTOR', 'AGENT', 'RENTER'])).toBe('realtor');
  });
});

describe('workspace preference', () => {
  const open = usablePortal;

  it('opens the workspace the person chose when they hold it', () => {
    expect(open(['LANDLORD', 'PROPERTY_OWNER'], 'owner')).toBe('owner');
  });

  it('falls back to the most senior workspace for a choice they no longer hold', () => {
    expect(open(['PROPERTY_OWNER'], 'landlord')).toBe('owner');
    expect(open(['LANDLORD', 'PROPERTY_OWNER'], null)).toBe('landlord');
  });

  it('opens the native realtor and estate-manager workspaces', () => {
    expect(open(['REALTOR', 'RENTER'], 'realtor')).toBe('realtor');
    expect(open(['ESTATE_MANAGER'])).toBe('estate');
  });

  it('lists only built workspaces, most senior first', () => {
    expect(switchablePortals(['RENTER', 'REALTOR', 'LANDLORD'])).toEqual([
      'landlord',
      'realtor',
      'renter',
    ]);
  });
});
