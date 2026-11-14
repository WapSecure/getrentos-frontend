'use client';

import { useParams } from 'next/navigation';
import { ServiceChargeStatementView } from '@/components/shared/service-charge/ServiceChargeStatementView';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterServiceChargesService } from '@/services/renterServiceChargesService';

/** A tenant's service charge as a statement. */
export default function RenterServiceChargeStatementPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ServiceChargeStatementView
      id={id}
      config={{
        queryKey: renterKeys.serviceCharge(id),
        listKey: renterKeys.serviceCharges,
        get: (statementId) => unwrap(renterServiceChargesService.get(statementId)),
        raiseQuery: (statementId, input) => unwrap(renterServiceChargesService.raiseQuery(statementId, input)),
        withdrawQuery: (queryId) => unwrap(renterServiceChargesService.withdrawQuery(queryId)),
        back: { label: 'Payments', href: '/renter/payments?tab=service-charges' },
        pay: { href: '/renter/payments', label: 'Payments', how: 'with your rent' },
        replier: 'Your landlord or their agency',
        holder: 'tenancy',
      }}
    />
  );
}
