// Copy for the landlord's "Cancel viewing" / "Decline" confirmation, naming who, what and when.

export interface ViewingCancelTarget {
  renterName: string;
  propertyName: string;
  status: 'requested' | 'confirmed' | string;
  scheduledAt?: string;
  preferredAt?: string;
}

const formatWhen = (iso?: string) => {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
};

export function viewingCancelCopy(target: ViewingCancelTarget) {
  const renter = target.renterName?.trim() || 'the renter';
  const property = target.propertyName?.trim() || 'this property';
  const Renter = renter.charAt(0).toUpperCase() + renter.slice(1);
  if (target.status === 'confirmed') {
    const when = formatWhen(target.scheduledAt);
    return {
      title: 'Cancel this viewing?',
      description: `${Renter}'s viewing of ${property}${when ? ` on ${when}` : ''} will be cancelled and they will be told. This can't be undone; they would need to request a new viewing.`,
      confirmLabel: 'Cancel viewing',
      success: `Viewing with ${renter} cancelled.`,
    };
  }
  const when = formatWhen(target.preferredAt);
  return {
    title: 'Decline this viewing request?',
    description: `${Renter} asked to view ${property}${when ? ` on ${when}` : ''}. Declining tells them the request was turned down. This can't be undone.`,
    confirmLabel: 'Decline request',
    success: `Viewing request from ${renter} declined.`,
  };
}
