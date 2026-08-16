'use client';

import { CheckCircle2, Clock, AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { FinancingInstallment, FinancingPlan, InstallmentStatus } from '@/types/financing';

interface ActiveFinancingPlanCardProps {
  plan: FinancingPlan;
  onPayInstallment: (installmentId: string) => void;
}

const statusConfig: Record<
  InstallmentStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  paid: {
    label: 'Paid',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    icon: CheckCircle2,
  },
  due: {
    label: 'Due Now',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    icon: AlertCircle,
  },
  upcoming: {
    label: 'Upcoming',
    className: 'text-muted-foreground bg-secondary',
    icon: Clock,
  },
};

export const ActiveFinancingPlanCard = ({
  plan,
  onPayInstallment,
}: ActiveFinancingPlanCardProps) => {
  const paidCount = plan.installments.filter((i) => i.status === 'paid').length;
  const progressPct = Math.round((paidCount / plan.installments.length) * 100);
  const nextDue = plan.installments.find((i) => i.status === 'due' || i.status === 'overdue');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 bg-accent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Active Flex Plan
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">{plan.propertyName}</h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Landlord paid in full on {formatDate(plan.landlordPaidAt)}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat
              label="Financed Amount"
              value={formatCurrency(plan.rentAmount, { compact: true })}
            />
            <Stat
              label="Monthly Installment"
              value={formatCurrency(plan.monthlyInstallment, { compact: true })}
            />
            <Stat label="Term" value={`${plan.planLengthMonths} months`} />
            <Stat label="Service Fee" value={`${plan.feePercent}%`} />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>
                {paidCount} of {plan.installments.length} installments paid
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {nextDue && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-border mb-6">
              <div>
                <p className="text-xs text-muted-foreground">Next payment due</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(nextDue.amount, { compact: true })}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(nextDue.dueDate)}</p>
              </div>
              <Button variant="primary" onClick={() => onPayInstallment(nextDue.id)}>
                Pay Installment
              </Button>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Installment Schedule</p>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {plan.installments.map((installment) => (
                <InstallmentRow key={installment.id} installment={installment} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
  </div>
);

const InstallmentRow = ({ installment }: { installment: FinancingInstallment }) => {
  const status = statusConfig[installment.status];
  const StatusIcon = status.icon;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground w-16">
          #{installment.installmentNumber}
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(installment.amount, { compact: true })}
          </p>
          <p className="text-xs text-muted-foreground">
            {installment.status === 'paid' && installment.paidDate
              ? `Paid ${formatDate(installment.paidDate)}`
              : `Due ${formatDate(installment.dueDate)}`}
          </p>
        </div>
      </div>
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}
      >
        <StatusIcon className="w-3 h-3" />
        {status.label}
      </span>
    </div>
  );
};
