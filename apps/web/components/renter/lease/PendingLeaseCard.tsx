'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSignature,
  FileText,
  Lock,
  Wallet,
} from 'lucide-react';
import { Button, Checkbox, SignaturePad } from '@getrentos/ui';
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
 * payment into escrow, then waits for the landlord to hand over — each stage
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
        ? 'Payment held in escrow'
        : 'A lease is waiting for your signature';

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
        <div>
          <h2 className="font-semibold text-foreground">{heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lease.propertyName} — {lease.unitName}
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
        <div className="p-4 mx-5 mt-5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            You have signed. The lease now depends on the first payment.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
            {lease.amountDue !== undefined
              ? `${formatCurrency(lease.amountDue)} must reach escrow before the lease can proceed.`
              : 'The first payment must reach escrow before the lease can proceed.'}
            {lease.paymentDueAt && ` Due by ${formatDeadline(lease.paymentDueAt)}.`} If it is not
            paid by then the lease lapses on its own and the property goes back on the market. Your
            money is held in escrow and is not released to the landlord until you have the keys.
          </p>
        </div>
      )}

      {stage === 'awaiting_landlord' && (
        <div className="p-4 mx-5 mt-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Your payment is being held in escrow.
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1.5">
            The landlord has been asked to confirm handover. The lease becomes fully executed once
            they do, and the money stays in escrow until after that.
          </p>
        </div>
      )}

      {stage === 'sent' && (
        <div className="p-3 mx-5 mt-5 rounded-lg bg-secondary text-muted-foreground text-xs">
          <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Read the terms, then sign. Nothing is owed until your signature is on the lease — after
          that, the first payment goes into escrow and the landlord hands over.
        </div>
      )}

      {stage === 'sent' && (
        <>
          <div className="p-5 space-y-3 border-b border-border">
            <p className="text-sm text-muted-foreground">
              Read the whole agreement before you sign — it is what you are agreeing to, not the
              summary above.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              isLoading={opening}
              onClick={async () => {
                setOpening(true);
                const res = await renterService.downloadLeasePdf(lease.id);
                setOpening(false);
                if (res.success) setHasOpened(true);
              }}
            >
              <FileText className="w-4 h-4" />
              {hasOpened ? 'Download the lease again' : 'Read the full lease (PDF)'}
            </Button>
            <label
              className={`flex items-start gap-2 text-sm ${hasOpened ? 'text-foreground cursor-pointer' : 'text-muted-foreground'}`}
            >
              <Checkbox
                checked={agreed}
                onCheckedChange={setAgreed}
                disabled={!hasOpened}
                aria-label="I have read the lease and agree to its terms"
              />
              {hasOpened
                ? 'I have read the lease and agree to its terms'
                : 'Open the lease first to confirm you have read it'}
            </label>
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
          <Link href="/renter/payments">
            <Button className="gap-2">
              <Wallet className="w-4 h-4" />
              Pay {lease.amountDue !== undefined ? formatCurrency(lease.amountDue) : 'first rent'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
