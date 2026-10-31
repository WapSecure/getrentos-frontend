import type { PlatformRole } from '@/types/admin';

/** Display names for the role ids the admin API returns. */
export const ROLE_LABELS: Record<PlatformRole, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  owner: 'Property Owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  estate: 'Estate Manager',
  property_manager: 'Property Manager',
  gateman: 'Gateman',
  resident: 'Resident',
  admin: 'Staff',
};

export const roleLabel = (role: string) =>
  ROLE_LABELS[role as PlatformRole] ?? role.replace(/_/g, ' ');
