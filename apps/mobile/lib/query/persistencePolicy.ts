// AsyncStorage is unencrypted, so only public data is written: an allow list, because a deny list misses new keys.
const PUBLIC_ROOTS: ReadonlySet<string> = new Set(['market']);
const PRIVATE_UNDER_PUBLIC_ROOT: ReadonlySet<string> = new Set(['saved']);

export function shouldPersistQuery(query: {
  queryKey: readonly unknown[];
  state: { status: string };
  meta?: Record<string, unknown> | null;
}) {
  if (query.state.status !== 'success') return false;
  if (query.meta?.persist !== undefined) return query.meta.persist === true;
  const [root, section] = query.queryKey;
  return (
    typeof root === 'string' &&
    PUBLIC_ROOTS.has(root) &&
    !(typeof section === 'string' && PRIVATE_UNDER_PUBLIC_ROOT.has(section))
  );
}
