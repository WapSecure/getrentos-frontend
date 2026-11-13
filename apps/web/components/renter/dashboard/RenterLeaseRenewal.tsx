'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, FileText, ArrowRight, BadgeCheck } from '@sureground/icons';
import { Alert } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { DescriptionList } from '@sureground/ui';
import { formatPercent } from '@sureground/shared';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { leaseRentSuffix } from '@/lib/leaseTerm';
import { renterKeys } from '@/lib/queryKeys';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const RenterLeaseRenewal = () => {
  const { data: lease = null } = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
  });
  const { data: renewalOffer = null } = useQuery({
    queryKey: renterKeys.renewalOffer,
    // The API answers "no offer" with an empty body, which the client turns into undefined and React Query rejects.
    queryFn: async () => (await unwrap(renterService.getRenewalOffer())) ?? null,
    enabled: lease?.status === 'expiring',
  });

  // Only a lease the backend marks as expiring is actionable here.
  if (!lease || lease.status !== 'expiring') return null;

  const daysUntilEnd = Math.ceil(
    (new Date(lease.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">Your tenancy</p>
          <h2 className="text-base font-semibold tracking-[-0.015em] text-foreground">
            Lease renewal
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan your next lease term with clarity.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="p-5">
        <Alert
          variant="info"
          icon={BadgeCheck}
          className="mb-5"
          title={renewalOffer ? 'Renewal offer available' : 'Lease approaching its end date'}
        >
          {renewalOffer
            ? `Your landlord sent a renewal offer on ${formatDate(renewalOffer.offerDate)}`
            : `${Math.max(daysUntilEnd, 0)} days remain. Your property owner has not sent an offer yet.`}
        </Alert>

        <div className="mb-5 rounded-xl border border-border px-4">
          <DescriptionList
            layout="rows"
            items={[
              { label: 'Property', value: lease.propertyName },
              { label: 'Current lease ends', value: formatDate(lease.endDate) },
              {
                label: 'Current rent',
                value: (
                  <>
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                      lease.rentAmount
                    )}
                    {leaseRentSuffix(lease.rentPeriod, lease.startDate, lease.endDate)}
                  </>
                ),
              },
              ...(renewalOffer
                ? [
                    {
                      label: 'Expected increase',
                      value: (
                        <span className="text-warning">
                          {formatPercent(renewalOffer.increasePercentage)}% (
                          {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: 'NGN',
                          }).format(renewalOffer.newRentAmount - lease.rentAmount)}
                          )
                        </span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <Button
          href={`${ROUTES.RENTER_HOME}?tab=lease`}
          variant="outline"
          fullWidth
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Review lease terms
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </motion.div>
  );
};
