/**
 * One-shot flag set when a session ends involuntarily (refresh failed), so the
 * sign-in screen can explain *why* the user landed back there. Voluntary
 * sign-out never sets it.
 */
let expired = false;

export function markSessionExpired() {
  expired = true;
}

/** Reads and clears the flag. */
export function consumeSessionExpired(): boolean {
  const v = expired;
  expired = false;
  return v;
}
