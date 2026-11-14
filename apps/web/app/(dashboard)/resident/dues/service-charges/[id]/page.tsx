'use client';

import { useParams } from 'next/navigation';
import { ServiceChargeStatementView } from '@/components/shared/service-charge/ServiceChargeStatementView';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { residentServiceChargesService } from '@/services/residentServiceChargesService';

/** An estate resident's service charge as a statement. */
export default function ResidentServiceChargeStatementPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <ServiceChargeStatementView
      id={id}
      config={{
        queryKey: estateResidentKeys.serviceCharge(id),
        listKey: estateResidentKeys.serviceCharges,
        get: (statementId) => unwrap(residentServiceChargesService.get(statementId)),
        raiseQuery: (statementId, input) =>
          unwrap(residentServiceChargesService.raiseQuery(statementId, input)),
        withdrawQuery: (queryId) => unwrap(residentServiceChargesService.withdrawQuery(queryId)),
        back: { label: 'Dues', href: '/resident/dues' },
        pay: { href: '/resident/dues', label: 'Dues', how: 'with your estate dues' },
        replier: 'Your estate manager',
        holder: 'household',
      }}
    />
  );
}
