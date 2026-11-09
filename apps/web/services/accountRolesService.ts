import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AddableRoleId =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'estate';

export const ADDABLE_ROLE_IDS: AddableRoleId[] = [
  'renter',
  'landlord',
  'owner',
  'buyer',
  'realtor',
  'agent',
  'estate',
];

export interface AddRoleResult {
  role: AddableRoleId;
  added: boolean;
  roles: string[];
}

export const accountRolesService = {
  addRole: (role: AddableRoleId): Promise<ApiResponse<AddRoleResult>> =>
    safeCall(() =>
      authFetch<AddRoleResult>('/users/me/roles', {
        method: 'POST',
        body: JSON.stringify({ role }),
      })
    ),
};
