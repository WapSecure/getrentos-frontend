import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/** The roles anyone may choose at sign-up, and so may add to their account later. */
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
  /** Every role the account now holds, as role codes (as sign-in returns them). */
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
