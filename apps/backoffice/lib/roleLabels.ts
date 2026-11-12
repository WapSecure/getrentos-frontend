import type { PlatformRole } from '@/types/admin';

export const ROLE_LABELS: Record<PlatformRole, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  owner: 'Property owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  estate: 'Estate manager',
  property_manager: 'Property manager',
  gateman: 'Gateman',
  resident: 'Resident',
  admin: 'Staff',
};

export const roleLabel = (role: string) =>
  ROLE_LABELS[role as PlatformRole] ?? role.replace(/_/g, ' ');
