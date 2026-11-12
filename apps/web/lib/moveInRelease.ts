import { formatCurrency } from './format';

// Confirmation shown once the tenant's move-in releases the held rent.
export function moveInReleasedMessage(heldNaira?: number | null, propertyName?: string): string {
  const where = propertyName ? ` for ${propertyName}` : '';
  return heldNaira && heldNaira > 0
    ? `${formatCurrency(heldNaira)} released to your landlord${where}.`
    : `Your rent${where} has been released to your landlord.`;
}
