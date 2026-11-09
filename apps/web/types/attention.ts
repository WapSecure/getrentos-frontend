/** `manager` is a property-management firm, `estate` one estate. */
export type AttentionPersona =
  | 'renter'
  | 'landlord'
  | 'owner'
  | 'buyer'
  | 'realtor'
  | 'agent'
  | 'manager'
  | 'resident'
  | 'estate';

export interface AttentionItem {
  key: string;
  severity: 'urgent' | 'soon' | 'info';
  title: string;
  detail?: string;
  link: { path: string; label: string };
}
