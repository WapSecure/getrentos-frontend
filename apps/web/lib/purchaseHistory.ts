// The purchase History labels each actor by their role in this sale. Older API responses tag any
// renter account as TENANT (a property-management label), which means nothing on a purchase.

type Kind =
  | 'MANAGER'
  | 'SUREGROUND'
  | 'TENANT'
  | 'SYSTEM'
  | 'OTHER'
  | 'YOU'
  | 'BUYER'
  | 'SELLER'
  | 'REPRESENTATIVE';

export function purchaseHistoryItems<T extends { actor: string; actorKind: Kind }>(
  items: readonly T[],
  representatives: readonly { name?: string }[]
): T[] {
  const repNames = new Set(
    representatives.map((r) => r.name?.trim().toLowerCase()).filter((n): n is string => !!n)
  );
  return items.map((item) => {
    if (item.actorKind !== 'TENANT' && item.actorKind !== 'OTHER') return item;
    if (repNames.has(item.actor.trim().toLowerCase())) {
      return { ...item, actorKind: 'REPRESENTATIVE' };
    }
    return item.actorKind === 'TENANT' ? { ...item, actorKind: 'OTHER' } : item;
  });
}
