'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinancingEligibilityCard } from '@/components/renter/financing/FinancingEligibilityCard';
import { ApplyFinancingModal } from '@/components/renter/financing/ApplyFinancingModal';
import { ActiveFinancingPlanCard } from '@/components/renter/financing/ActiveFinancingPlanCard';
import { PageErrorState, PageLoadingState, Toast } from '@getrentos/ui';
import { useState } from 'react';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { FinancingPlanLength } from '@/types/financing';

export default function RenterFinancingPage() {
  const queryClient = useQueryClient();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const {
    data: overview,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: renterKeys.financing,
    queryFn: () => unwrap(renterService.getFinancing()),
  });

  const applyMutation = useMutation({
    mutationFn: (months: FinancingPlanLength) => unwrap(renterService.applyFinancing(months)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.financing });
      queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
      setIsApplyModalOpen(false);
      setToast(
        `Approved! Your landlord has been paid in full — repay in interest-free installments.`
      );
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: (installmentId: string) =>
      unwrap(renterService.payFinancingInstallment(installmentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.financing });
      setToast('Installment paid.');
    },
  });

  const handleApply = (months: FinancingPlanLength) => {
    applyMutation.mutate(months);
  };

  const handlePayInstallment = (installmentId: string) => {
    payInstallmentMutation.mutate(installmentId);
  };

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (isError) {
    return (
      <PageErrorState
        title="Financing details are unavailable"
        description="We could not load your eligibility or active repayment plan. No payment has been attempted."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const rentAmount = overview?.rentAmount ?? 0;
  const trustScore = overview?.trustScore ?? 0;
  const plan = overview?.plan ?? null;

  return (
    <>
      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}

      {plan ? (
        <ActiveFinancingPlanCard plan={plan} onPayInstallment={handlePayInstallment} />
      ) : (
        <FinancingEligibilityCard
          rentAmount={rentAmount}
          trustScore={trustScore}
          isPending={applyMutation.isPending}
          onApply={() => setIsApplyModalOpen(true)}
        />
      )}

      <ApplyFinancingModal
        open={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        rentAmount={rentAmount}
        onSubmit={handleApply}
      />
    </>
  );
}
