// Set when Google created the account, so role selection knows to finish it with /auth/initial-roles.
const KEY = 'sureground:signup:social';

export function markSocialSignup() {
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    // Storage blocked: the person keeps the renter role and can add others in settings.
  }
}

export function isSocialSignupPending(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function clearSocialSignup() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
