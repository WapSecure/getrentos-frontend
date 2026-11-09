import { apiFetch } from './client';
import type { SignupRoleId } from '../roles';

export interface AddRoleResult {
  role: SignupRoleId;
  /** False when the account already had the role. */
  added: boolean;
  roles: string[];
}

export const accountRolesApi = {
  add: (role: SignupRoleId) =>
    apiFetch<AddRoleResult>('/users/me/roles', { method: 'POST', body: { role } }),
};
