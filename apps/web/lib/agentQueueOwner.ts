import { ApiError } from '@/lib/apiHelpers';
import { getAuthToken, getStoredUser } from '@/lib/authStorage';

export function currentAgentQueueOwner(): string | null {
  const user = getStoredUser<{ id?: string; roles?: string[] }>();
  return getAuthToken() && user?.id && user.roles?.includes('AGENT') ? user.id : null;
}

export function requireAgentQueueOwner(expectedOwner?: string): string {
  const owner = currentAgentQueueOwner();
  if (!owner || (expectedOwner && owner !== expectedOwner)) {
    throw new ApiError(
      409,
      'Your account changed. Sign in again before saving or uploading this record.'
    );
  }
  return owner;
}

/** A server rejection needs correction in the form, not an automatic replay. */
export function isAgentConnectionFailure(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}
