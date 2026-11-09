'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinancingEligibilityCard } from '@/components/renter/financing/FinancingEligibilityCard';
import { ApplyFinancingModal } from '@/components/renter/financing/ApplyFinancingModal';
import { ActiveFinancingPlanCard } from '@/components/renter/financing/ActiveFinancingPlanCard';
import { FlexPausedCard } from '@/components/renter/financing/FlexPausedCard';
import { PayDialog } from '@/components/shared/payments/PayDialog';
import { CardSkeleton, PageErrorState, Skeleton, useToast } from '@sureground/ui';
import { useState } from 'react';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { renterKeys } from '@/lib/queryKeys';
import type { FinancingPlanLength } from '@/types/financing';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';

export const FinancingView = () => {
  const queryClient = useQueryClient();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const toast = useToast();
  // Which company takes the instalment, and why the last one could not.
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);
  // Why the last try failed for any other reason (network, a check, the plan).
  const [payError, setPayError] = useState<string | null>(null);
  // The instalment open in the pay dialog.
  const [payingInstallmentId, setPayingInstallmentId] = useState<string | null>(null);

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
      toast.success('Your Flex plan is set up. It shows here once your landlord has been paid.');
    },
  });

  const payInstallmentMutation = useMutation({
    mutationFn: ({
      installmentId,
      provider,
    }: {
      installmentId: string;
      provider?: PaymentProvider;
    }) => unwrap(renterService.payFinancingInstallment(installmentId, provider)),
    onMutate: () => {
      setProviderError(null);
      setPayError(null);
    },
    onError: (error, variables) => {
      // That company cannot take it right now: the choice reopens with another picked.
      const unavailable = providers.recover(error, variables.provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      setPayError(error.message || 'We couldn’t start this payment. Please try again.');
    },
    onSuccess: (updated) => {
      if (updated.authorizationUrl) {
        // Real gateway flow: the installment is PROCESSING until the
        // renter completes checkout, so redirect instead of claiming success.
        window.location.href = updated.authorizationUrl;
        return;
      }
      setPayingInstallmentId(null);
      queryClient.invalidateQueries({ queryKey: renterKeys.financing });
      toast.success('Instalment paid.');
    },
  });

  const handleApply = (months: FinancingPlanLength) => {
    applyMutation.mutate(months);
  };

  const handlePayInstallment = (installmentId: string) => {
    payInstallmentMutation.mutate({ installmentId, provider: providers.provider });
  };

  const closePayDialog = () => {
    setPayingInstallmentId(null);
    setProviderError(null);
    setPayError(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-[1.75rem]" />
        <CardSkeleton lines={5} />
      </div>
    );
  }

  if (isError && !overview) {
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
  const newPlansOpen = overview?.newPlansOpen === true;
  const payingInstallment =
    plan?.installments.find((installment) => installment.id === payingInstallmentId) ?? null;

  return (
    <>
      {plan ? (
        <ActiveFinancingPlanCard
          plan={plan}
          onPayInstallment={setPayingInstallmentId}
          isPaying={payInstallmentMutation.isPending}
        />
      ) : !newPlansOpen ? (
        <FlexPausedCard />
      ) : (
        <FinancingEligibilityCard
          rentAmount={rentAmount}
          trustScore={trustScore}
          isPending={applyMutation.isPending}
          onApply={() => setIsApplyModalOpen(true)}
        />
      )}

      <PayDialog
        open={!!plan && !!payingInstallment}
        onClose={closePayDialog}
        title="Pay instalment"
        context={
          payingInstallment && plan
            ? `${plan.propertyName} · instalment ${payingInstallment.installmentNumber} of ${plan.installments.length}`
            : undefined
        }
        dueDate={payingInstallment?.dueDate}
        overdue={payingInstallment?.status === 'overdue'}
        owed={payingInstallment?.amount ?? 0}
        itemLabel="Instalment"
        receiverLine={`The fee goes to the payment company, so the full ${formatCurrency(payingInstallment?.amount ?? 0)} is applied to your Flex plan.`}
        protection="This payment is applied to your Flex plan."
        providers={providers}
        providerError={providerError}
        error={payError}
        busy={payInstallmentMutation.isPending}
        onPay={() => payingInstallment && handlePayInstallment(payingInstallment.id)}
      />

      <ApplyFinancingModal
        open={newPlansOpen && isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        rentAmount={rentAmount}
        onSubmit={handleApply}
        isSubmitting={applyMutation.isPending}
      />
    </>
  );
};
