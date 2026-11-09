'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Phone } from 'lucide-react';
import {
  Alert,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ListSkeleton,
  SaveButton,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { homeManagementKeys, landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { homeManagementService } from '@/services/homeManagementService';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import { formatVisit } from '@/components/landlord/vendors/VendorCard';
import type { Vendor, VendorJob } from '@/types/landlord';
import { BankAccountFields } from '@/components/shared/payouts/BankAccountFields';
import { PayoutHoldNotice } from '@/components/shared/payouts/PayoutHoldNotice';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  PAYOUT_CHANGE_COOLDOWN_HINT,
  lookupAllowsSave,
  payoutAccountLabel,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  withStepUpSummary,
  type AccountLookup,
} from '@sureground/shared';

interface VendorDetailModalProps {
  vendor: Vendor | null;
  onClose: () => void;
}

const statusLabel: Record<string, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
};

const JobRow = ({ job }: { job: VendorJob }) => (
  <li className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{job.issueTitle}</p>
      <p className="text-xs text-muted-foreground truncate">
        {job.propertyName}, {job.unitName} · {statusLabel[job.status] ?? job.status}
        {job.resolvedAt ? ` ${formatDate(job.resolvedAt)}` : ''}
      </p>
    </div>
    <div className="shrink-0 text-right tabular-nums">
      <p className="text-sm text-foreground">
        {job.approvedCost === null ? '—' : formatCurrency(job.approvedCost)}
      </p>
      {job.rating !== null && <StarRating value={job.rating} label="Job rating" />}
    </div>
  </li>
);

export const VendorDetailModal = ({ vendor, onClose }: VendorDetailModalProps) => {
  const queryClient = useQueryClient();
  const planGate = usePlanGateModal();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: landlordKeys.vendorDetail(vendor?.id ?? ''),
    queryFn: () => unwrap(landlordService.getVendorDetail(vendor?.id ?? '')),
    enabled: !!vendor,
  });

  const { data: payoutAccount } = useQuery({
    queryKey: homeManagementKeys.vendorPayoutAccount(vendor?.id ?? ''),
    queryFn: () => unwrap(homeManagementService.getVendorPayoutAccount(vendor?.id ?? '')),
    enabled: !!vendor,
  });

  const savePayoutAccount = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
          owner: vendor?.name ? `${vendor.name}’s` : 'this vendor’s',
        }),
        () =>
          unwrap(
            homeManagementService.updateVendorPayoutAccount(vendor?.id ?? '', {
              bankCode,
              accountNumber,
            })
          )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: homeManagementKeys.vendorPayoutAccount(vendor?.id ?? ''),
      });
      setBankCode('');
      setAccountNumber('');
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) return;
      setPayoutError(error.message || "Unable to save this vendor's payout account.");
    },
  });

  if (!vendor) return null;
  const current = data?.vendor ?? vendor;
  const canSavePayoutAccount = lookupAllowsSave(lookup);

  const stats = [
    { label: 'Jobs completed', value: String(current.jobsCompleted) },
    { label: 'Open jobs', value: String(current.openJobs) },
    { label: 'Total spend', value: formatCurrency(current.totalSpend) },
    {
      label: 'Average per job',
      value: current.averageCost === null ? '—' : formatCurrency(current.averageCost),
    },
    {
      label: 'Average time to finish',
      value:
        current.averageResolutionDays === null
          ? '—'
          : `${current.averageResolutionDays} day${current.averageResolutionDays === 1 ? '' : 's'}`,
    },
  ];

  return (
    <>
      <Dialog open onOpenChange={(next) => !next && onClose()}>
        <DialogContent padded={false} className="flex flex-col sm:max-w-lg">
          <div className="p-4 pr-12 border-b border-border flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <DialogTitle className="font-semibold text-foreground truncate">
                {current.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {current.serviceType}
                {!current.isActive && ' · Inactive'}
              </DialogDescription>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" />
                {current.phone}
              </p>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {current.ratingCount > 0 ? (
                <>
                  <StarRating value={current.rating} size="md" label={`${current.name} rating`} />
                  <span className="text-lg font-semibold text-foreground">
                    {current.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    from {current.ratingCount} rated job{current.ratingCount === 1 ? '' : 's'}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No ratings yet</span>
              )}
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 tabular-nums">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="text-base font-semibold text-foreground">{stat.value}</dd>
                  <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                </div>
              ))}
            </dl>

            {isPending && <ListSkeleton rows={3} />}
            {isError && !data && (
              <Alert variant="danger">
                We could not load this vendor&apos;s job history. Please close this and try again.
              </Alert>
            )}

            {data && (
              <>
                <section>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Upcoming visits</h4>
                  {data.upcomingVisits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No visits booked.</p>
                  ) : (
                    <ul>
                      {data.upcomingVisits.map((job) => (
                        <li
                          key={job.id}
                          className="flex items-center gap-2 py-2 border-b border-border last:border-0 text-sm"
                        >
                          <CalendarClock className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground">
                            {job.scheduledFor ? formatVisit(job.scheduledFor) : ''}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {job.issueTitle} · {job.propertyName}, {job.unitName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Job history</h4>
                  {data.recentJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No jobs yet. Assign this vendor to a maintenance request to start their
                      record.
                    </p>
                  ) : (
                    <ul>
                      {data.recentJobs.map((job) => (
                        <JobRow key={job.id} job={job} />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}

            <section>
              <h4 className="text-sm font-semibold text-foreground mb-1">Payout account</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Where this vendor is paid when you pay an approved invoice: transfers run through
                Paystack.
              </p>

              {payoutAccount?.accountNumber && (
                <Card className="p-3 mb-3">
                  <p className="text-sm font-medium text-foreground">
                    {payoutAccountLabel(payoutAccount)} · {payoutAccount.accountName}
                  </p>
                  {payoutAccount.verified ? (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <p className="text-xs text-success">
                        Bank account verified and active for payouts
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2">
                      Not yet verified: save it again to resolve it against the bank.
                    </p>
                  )}
                  <PayoutHoldNotice holdUntil={payoutAccount.payoutHoldUntil} />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {PAYOUT_CHANGE_COOLDOWN_HINT}
                  </p>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <BankAccountFields
                  idPrefix="vendor-payout"
                  bankCode={bankCode}
                  onBankCode={setBankCode}
                  accountNumber={accountNumber}
                  onAccountNumber={setAccountNumber}
                  onLookup={setLookup}
                />
              </div>

              <div className="mt-3 space-y-2">
                {payoutError && <Alert variant="danger">{payoutError}</Alert>}
                <SaveButton
                  label={saveAccountLabel(lookup, 'Save payout account')}
                  disabled={!canSavePayoutAccount}
                  onClick={() => (canSavePayoutAccount ? savePayoutAccount.mutateAsync() : false)}
                />
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />
    </>
  );
};
