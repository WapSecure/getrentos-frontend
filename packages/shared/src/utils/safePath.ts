/**
 * A same-site path to send someone to after sign-in: one leading slash, not
 * `//host` or `/\host`, which browsers read as another site.
 */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  return typeof path === 'string' && /^\/(?![/\\])/.test(path) && !/[\r\n\t]/.test(path);
}
