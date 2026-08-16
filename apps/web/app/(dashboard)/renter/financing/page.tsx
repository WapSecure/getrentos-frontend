'use client';

import { useState } from 'react';
import { FinancingEligibilityCard } from '@/components/renter/financing/FinancingEligibilityCard';
import { ApplyFinancingModal } from '@/components/renter/financing/ApplyFinancingModal';
import { ActiveFinancingPlanCard } from '@/components/renter/financing/ActiveFinancingPlanCard';
import { Toast } from '@getrentos/ui';
import { getFinancingPlanOptions } from '@/lib/financing';
import type {
  FinancingApplicationStatus,
  FinancingInstallment,
  FinancingPlan,
  FinancingPlanLength,
} from '@/types/financing';

const RENT_AMOUNT = 2_400_000;
const TRUST_SCORE = 78;
const PROPERTY_NAME = 'Modern Downtown Loft';
const LANDLORD_NAME = 'Chuka Nwosu';

const buildInstallments = (
  months: FinancingPlanLength,
  monthlyInstallment: number
): FinancingInstallment[] => {
  const today = new Date();
  return Array.from({ length: months }).map((_, index) => {
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + index + 1);
    return {
      id: `inst_${index + 1}`,
      installmentNumber: index + 1,
      dueDate: dueDate.toISOString(),
      amount: monthlyInstallment,
      status: index === 0 ? 'due' : 'upcoming',
    };
  });
};

export default function RenterFinancingPage() {
  const [applicationStatus, setApplicationStatus] =
    useState<FinancingApplicationStatus>('not_applied');
  const [plan, setPlan] = useState<FinancingPlan | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleApply = (months: FinancingPlanLength) => {
    setIsApplyModalOpen(false);
    setApplicationStatus('pending_review');

    window.setTimeout(() => {
      const option = getFinancingPlanOptions(RENT_AMOUNT).find((o) => o.months === months)!;
      const newPlan: FinancingPlan = {
        id: `flex_${Date.now()}`,
        propertyName: PROPERTY_NAME,
        landlordName: LANDLORD_NAME,
        rentAmount: RENT_AMOUNT,
        planLengthMonths: months,
        feePercent: option.feePercent,
        feeAmount: option.totalRepayable - RENT_AMOUNT,
        totalRepayable: option.totalRepayable,
        monthlyInstallment: option.monthlyInstallment,
        status: 'active',
        appliedAt: new Date().toISOString(),
        landlordPaidAt: new Date().toISOString(),
        installments: buildInstallments(months, option.monthlyInstallment),
      };
      setPlan(newPlan);
      setApplicationStatus('approved');
      setToast(
        `Approved! ${LANDLORD_NAME} has been paid ${new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
        }).format(RENT_AMOUNT)} in full.`
      );
    }, 2200);
  };

  const handlePayInstallment = (installmentId: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const index = prev.installments.findIndex((i) => i.id === installmentId);
      if (index === -1) return prev;

      const updatedInstallments = prev.installments.map((installment, i) => {
        if (i === index) {
          return { ...installment, status: 'paid' as const, paidDate: new Date().toISOString() };
        }
        if (i === index + 1) {
          return { ...installment, status: 'due' as const };
        }
        return installment;
      });

      const allPaid = updatedInstallments.every((i) => i.status === 'paid');
      return {
        ...prev,
        installments: updatedInstallments,
        status: allPaid ? 'completed' : prev.status,
      };
    });
    setToast('Installment paid — your Trust Score has been updated.');
  };

  return (
    <>
      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}

      {plan ? (
        <ActiveFinancingPlanCard plan={plan} onPayInstallment={handlePayInstallment} />
      ) : (
        <FinancingEligibilityCard
          rentAmount={RENT_AMOUNT}
          trustScore={TRUST_SCORE}
          isPending={applicationStatus === 'pending_review'}
          onApply={() => setIsApplyModalOpen(true)}
        />
      )}

      <ApplyFinancingModal
        open={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        rentAmount={RENT_AMOUNT}
        onSubmit={handleApply}
      />
    </>
  );
}
