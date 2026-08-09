'use client';

import { TrendingUp, Building2, CheckCircle2, Calendar, Flame } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { CreditReportingProfile, CreditBureau } from '@/types/credit-reporting';

interface CreditReportingDashboardProps {
  profile: CreditReportingProfile;
}

const bureaus: CreditBureau[] = [
  'CRC Credit Bureau',
  'FirstCentral Credit Bureau',
  'XDS Credit Bureau',
];

export const CreditReportingDashboard = ({ profile }: CreditReportingDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 bg-accent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Credit Reporting Active
                </span>
              </div>
              <h1 className="text-xl font-bold text-foreground">Building your credit history</h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Enrolled since {profile.enrolledAt ? formatDate(profile.enrolledAt) : '—'}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Stat
              icon={Flame}
              label="On-Time Streak"
              value={`${profile.consecutiveOnTimeMonths} month${profile.consecutiveOnTimeMonths === 1 ? '' : 's'}`}
            />
            <Stat
              icon={CheckCircle2}
              label="Payments Reported"
              value={String(profile.totalPaymentsReported)}
            />
            <Stat
              icon={Calendar}
              label="Next Report Date"
              value={formatDate(profile.nextReportDate)}
            />
          </div>

          <div className="rounded-xl border border-border p-4 mb-6">
            <p className="text-xs font-medium text-foreground mb-3">Reporting to</p>
            <div className="flex flex-wrap gap-2">
              {bureaus.map((bureau) => (
                <span
                  key={bureau}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
                >
                  <Building2 className="w-3 h-3" />
                  {bureau}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-3">Reporting History</p>
            {profile.reportedPayments.length === 0 ? (
              <div className="rounded-xl border border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Your first payment will be reported after your next rent cycle.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {profile.reportedPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{payment.month}</p>
                      <p className="text-xs text-muted-foreground">
                        Reported {formatDate(payment.reportedDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(payment.amount, { compact: true })}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          payment.status === 'on_time'
                            ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                            : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                        }`}
                      >
                        {payment.status === 'on_time' ? 'On Time' : 'Late'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
  </div>
);
