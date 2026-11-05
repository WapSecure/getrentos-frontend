import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { kycApi } from '@/lib/api/kyc';
import { agencyFirmApi } from '@/lib/api/agencyFirm';

const LICENSE_LABEL: Record<string, string> = {
  APPROVED: 'Verified',
  PENDING_REVIEW: 'Being reviewed',
  NEEDS_CLARIFICATION: 'Needs more detail',
  REJECTED: 'Rejected: send again',
};

/**
 * What a realtor's or agent's account menu needs beyond identity: where their
 * licence stands, and whether they belong to a management firm (so their share
 * of its commissions is worth a row).
 */
export function useProSettings() {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const share = useQuery({
    queryKey: [...qk.agency.myPayout, 'summary'],
    queryFn: agencyFirmApi.mySummary,
  });
  const status = kyc.data?.license?.status;
  return {
    licenseLabel: status ? (LICENSE_LABEL[status] ?? undefined) : undefined,
    inAgency: !!(share.data?.agencyName || (share.data?.earned ?? 0) > 0),
  };
}
