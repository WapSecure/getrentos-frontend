import { apiFetch } from './client';
import type { SignupRoleId } from '../roles';

export interface AddRoleResult {
  role: SignupRoleId;
  /** False when the account already had the role. */
  added: boolean;
  /** Every role the account now holds, as role codes. */
  roles: string[];
}

export const accountRolesApi = {
  /** Adds one of the sign-up roles to the signed-in account. */
  add: (role: SignupRoleId) =>
    apiFetch<AddRoleResult>('/users/me/roles', { method: 'POST', body: { role } }),
};
