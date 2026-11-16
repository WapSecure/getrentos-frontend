export * from './estate-id-documents';
export * from './notification-email';
export * from './countries';
export * from './payment-protection';

export const USER_ROLES = {
  RENTER: 'renter',
  LANDLORD: 'landlord',
  OWNER: 'owner',
  BUYER: 'buyer',
  REALTOR: 'realtor',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;
