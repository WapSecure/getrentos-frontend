import { portalsForRoles, usablePortal } from '../lib/roles';

describe('portalsForRoles', () => {
  it('opens the consumer workspace the person signed up for, as on the web', () => {
    expect(usablePortal(['RENTER', 'RESIDENT', 'PROPERTY_BUYER'])).toBe('renter');
    expect(usablePortal(['PROPERTY_BUYER', 'RENTER'])).toBe('buyer');
  });

  it('still puts professional workspaces ahead of consumer ones, and the gate last', () => {
    expect(portalsForRoles(['RENTER', 'PROPERTY_BUYER', 'LANDLORD', 'GATEMAN'])).toEqual([
      'landlord',
      'renter',
      'buyer',
      'gateman',
    ]);
  });

  it('honours a workspace the person chose', () => {
    expect(usablePortal(['RENTER', 'PROPERTY_BUYER'], 'buyer')).toBe('buyer');
  });
});
