'use client';

import { useState } from 'react';
import { Clock, FileSignature, FileText, Lock, Wallet } from 'lucide-react';
import { Alert, Button, Card, Checkbox, SignaturePad } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { leaseRentLabel } from '@/lib/leaseTerm';
import { renterService, type PendingLease } from '@/services/renterService';

interface PendingLeaseCardProps {
  lease: PendingLease;
  onSign: (leaseId: string, signatureData: string) => void;
  isPending?: boolean;
}

const formatDeadline = (value: string) =>
  new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * A lease in progress is not one thing. The tenant signs, then owes the first
 * payment into escrow, then waits for the landlord to hand over: each stage
 * asks something different, so the card shows one at a time rather than
 * implying a single "sign here" step.
 */
export const PendingLeaseCard = ({ lease, onSign, isPending }: PendingLeaseCardProps) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [opening, setOpening] = useState(false);

  const stage = lease.status;
  const heading =
    stage === 'awaiting_payment'
      ? 'Pay the first rent to keep your lease'
      : stage === 'awaiting_landlord'
        ? 'Payment held by GetRentos'
        : 'A lease is waiting for your signature';

  return (
    <Card className="rounded-2xl">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
          {stage === 'awaiting_landlord' ? (
            <Lock className="w-5 h-5 text-primary" />
          ) : stage === 'awaiting_payment' ? (
            <Wallet className="w-5 h-5 text-primary" />
          ) : (
            <FileSignature className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">{heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lease.propertyName}: {lease.unitName}
          </p>
        </div>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground">Lease period</p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {leaseRentLabel(lease.rentPeriod, lease.startDate, lease.endDate)}
          </p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {formatCurrency(lease.rentAmount)}
          </p>
        </div>
        {lease.securityDeposit !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Security deposit</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {formatCurrency(lease.securityDeposit)}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Landlord</p>
          <p className="text-sm font-medium text-foreground mt-0.5">{lease.landlord.name}</p>
        </div>
      </div>

      {stage === 'awaiting_payment' && (
        <Alert
          variant="warning"
          className="mx-5 mt-5"
          title="You have signed. The lease now depends on the first payment."
        >
          <p className="text-xs">
            {lease.amountDue !== undefined
              ? `${formatCurrency(lease.amountDue)} must be paid to GetRentos before the lease can proceed.`
              : 'The first payment must be paid to GetRentos before the lease can proceed.'}
            {lease.paymentDueAt && ` Due by ${formatDeadline(lease.paymentDueAt)}.`} If it is not
            paid by then the lease lapses on its own and the property goes back on the market.
            GetRentos holds your money and does not pay the landlord until you have the keys.
          </p>
        </Alert>
      )}

      {stage === 'awaiting_landlord' && (
        <Alert variant="success" className="mx-5 mt-5" title="GetRentos is holding your payment.">
          <p className="text-xs">
            The landlord has been asked to confirm handover. The lease becomes fully executed once
            they do, and GetRentos keeps holding the money until after that.
          </p>
        </Alert>
      )}

      {stage === 'sent' && (
        <Alert variant="neutral" icon={Clock} className="mx-5 mt-5">
          <p className="text-xs">
            Read the terms, then sign. Nothing is owed until your signature is on the lease: after
            that, you pay the first rent to GetRentos, which holds it while the landlord hands
            over.
          </p>
        </Alert>
      )}

      {stage === 'sent' && (
        <>
          <div className="p-5 space-y-3 border-b border-border">
            <p className="text-sm text-muted-foreground">
              Read the whole agreement before you sign: it is what you are agreeing to, not the
              summary above.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              isLoading={opening}
              onClick={async () => {
                setOpening(true);
                try {
                  const res = await renterService.downloadLeasePdf(lease.id);
                  if (res.success) setHasOpened(true);
                } finally {
                  setOpening(false);
                }
              }}
            >
              <FileText className="w-4 h-4" />
              {hasOpened ? 'Download the lease again' : 'Read the full lease (PDF)'}
            </Button>
            <Checkbox
              checked={agreed}
              onCheckedChange={setAgreed}
              disabled={!hasOpened}
              label={
                hasOpened
                  ? 'I have read the lease and agree to its terms'
                  : 'Open the lease first to confirm you have read it'
              }
            />
          </div>
          <div className="p-5">
            <p className="text-sm font-medium text-foreground mb-2">Your signature</p>
            <SignaturePad onChange={setSignatureData} width={432} height={150} />
          </div>

          <div className="p-5 border-t border-border">
            <Button
              className="gap-2"
              isLoading={isPending}
              disabled={!signatureData || !agreed}
              onClick={() => signatureData && onSign(lease.id, signatureData)}
            >
              <FileSignature className="w-4 h-4" />
              Sign lease
            </Button>
          </div>
        </>
      )}

      {stage === 'awaiting_payment' && (
        <div className="p-5 border-t border-border">
          <Button href="/renter/payments" className="gap-2">
            <Wallet className="w-4 h-4" />
            Pay {lease.amountDue !== undefined ? formatCurrency(lease.amountDue) : 'first rent'}
          </Button>
        </div>
      )}
    </Card>
  );
};
