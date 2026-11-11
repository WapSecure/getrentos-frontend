'use client';

import { SuregroundManagedView } from '@/components/landlord/managed/SuregroundManagedView';

/** An owner's own management agreements: the same view landlords use. No change-manager flow exists for owners yet. */
export default function OwnerManagementPage() {
  return <SuregroundManagedView changeManagerHref={null} />;
}
