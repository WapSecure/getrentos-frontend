/**
 * The identity-document vocabulary for the gate's ID capture, shared by the web
 * console and the mobile gate console (both live in this repo).
 */
export * from './estate-id-documents';

export const USER_ROLES = {
  RENTER: 'renter',
  LANDLORD: 'landlord',
  OWNER: 'owner',
  BUYER: 'buyer',
  REALTOR: 'realtor',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;
