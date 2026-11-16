'use client';

import { SuregroundManagedView } from '@/components/landlord/managed/SuregroundManagedView';

/** The same view landlords use; owners have no change-manager flow yet. */
export default function OwnerManagementPage() {
  return <SuregroundManagedView changeManagerHref={null} />;
}
