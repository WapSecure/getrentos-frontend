'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditReportingOptIn } from '@/components/renter/credit-reporting/CreditReportingOptIn';
import { CreditReportingDashboard } from '@/components/renter/credit-reporting/CreditReportingDashboard';
import { Toast } from '@getrentos/ui';
import { useState } from 'react';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { CreditBureau } from '@/types/credit-reporting';

export default function RenterCreditReportPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: renterKeys.creditReporting,
    queryFn: () => unwrap(renterService.getCreditReporting()),
  });

  const enrollMutation = useMutation({
    mutationFn: (bureau?: CreditBureau) => unwrap(renterService.enrollCreditReporting(bureau)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: renterKeys.creditReporting });
      const count = updated?.reportedPayments?.length ?? 0;
      setToast(
        `You are enrolled — ${count} month${count === 1 ? '' : 's'} of on-time rent history will be reported.`
      );
    },
  });

  const handleEnroll = () => enrollMutation.mutate(undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading your credit-reporting status…
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}

      {profile?.status === 'enrolled' ? (
        <CreditReportingDashboard profile={profile} />
      ) : (
        <CreditReportingOptIn onEnroll={handleEnroll} isEnrolling={enrollMutation.isPending} />
      )}
    </>
  );
}
