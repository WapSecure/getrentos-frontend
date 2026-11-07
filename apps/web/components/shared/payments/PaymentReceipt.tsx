'use client';

import { useState, type ReactNode } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Home,
  Loader2,
  ShieldCheck,
  Smartphone,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button, Card, DescriptionList, IconButton, type DescriptionItem } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';
import { currentPath, withNext } from '@/lib/nextPath';
import type { PaymentKind, PaymentProvider, PaymentStatus } from '@/types/payments';

const WHAT: Record<PaymentKind, string> = {
  RENT: 'rent payment',
  ESCROW: 'deposit',
  SHORTLET: 'booking payment',
  LAND: 'land payment',
  FLEX: 'instalment',
  DUE: 'dues payment',
  VENDOR_TOP_UP: 'top-up for the vendor invoice',
};

/** What the payment was for, when the API did not say. */
const FALLBACK_TITLE: Record<PaymentKind, string> = {
  RENT: 'Rent',
  ESCROW: 'Purchase deposit',
  SHORTLET: 'Short-let booking',
  LAND: 'Land payment',
  FLEX: 'Flex instalment',
  DUE: 'Estate dues',
  VENDOR_TOP_UP: 'Vendor invoice top-up',
};

/** What happens to the money now, in the payer's words. */
const NEXT: Record<PaymentKind, { title: string; body: string }> = {
  RENT: {
    title: 'Your money is protected',
    body: 'GetRentos holds this rent until you confirm move-in, then releases it to your landlord. If something is wrong with the home, report it before then.',
  },
  ESCROW: {
    title: 'Held safely until completion',
    body: 'Your deposit stays with GetRentos and is only released to the seller when the sale completes. If it does not go ahead, you are refunded under the sale terms.',
  },
  SHORTLET: {
    title: 'Your stay is booked',
    body: 'Your host has been told. Any refundable security deposit comes back to you after check-out, minus any agreed damage.',
  },
  LAND: {
    title: 'Recorded against your purchase',
    body: 'This payment counts towards your land purchase. You can follow every step and document from your purchase page.',
  },
  FLEX: {
    title: 'Instalment recorded',
    body: 'This instalment is applied to your Flex plan. We will remind you before the next one is due.',
  },
  DUE: {
    title: 'Your estate has been paid',
    body: 'This due is marked paid for your household, and your estate manager can see it straight away.',
  },
  VENDOR_TOP_UP: {
    title: 'The vendor is paid next',
    body: 'Your top-up covers the shortfall on this invoice. The vendor is paid automatically within a few minutes.',
  },
};

const PROVIDER: Record<PaymentProvider, string> = { PAYSTACK: 'Paystack', MONNIFY: 'Monnify' };

const CHANNEL: Record<string, string> = {
  card: 'Card',
  bank: 'Bank account',
  bank_transfer: 'Bank transfer',
  account_transfer: 'Bank transfer',
  ussd: 'USSD',
  mobile_money: 'Mobile money',
};

/** A date and time as people in Lagos read it: "7 Nov 2026, 1:49 pm". */
const lagosDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const lagosDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** The big round mark at the top of each state. */
function StatusMark({
  icon: Icon,
  tone,
  spin,
}: {
  icon: LucideIcon;
  tone: 'success' | 'warning' | 'danger' | 'muted';
  spin?: boolean;
}) {
  const tones = {
    success: 'bg-success/10 text-success ring-success/20',
    warning: 'bg-warning/10 text-warning ring-warning/20',
    danger: 'bg-destructive/10 text-destructive ring-destructive/20',
    muted: 'bg-muted text-muted-foreground ring-border',
  } as const;
  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
      {tone === 'success' && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-success/15 motion-safe:animate-ping [animation-iteration-count:1.5]"
        />
      )}
      <span
        className={`relative flex h-20 w-20 items-center justify-center rounded-full ring-8 ${tones[tone]}`}
      >
        <Icon className={`h-9 w-9 ${spin ? 'motion-safe:animate-spin' : ''}`} strokeWidth={2.25} />
      </span>
    </div>
  );
}

function Reference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the reference is on screen to read.
    }
  };
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <span className="truncate font-mono text-xs" title={value}>
        {value}
      </span>
      <IconButton
        label={copied ? 'Copied' : 'Copy reference'}
        icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        variant="ghost"
        size="sm"
        onClick={copy}
      />
    </span>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-6 px-4 py-10">
      {children}
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  body,
  large,
}: {
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  /** The amount, shown big; a sentence stays smaller so it does not wrap. */
  large?: boolean;
}) {
  return (
    <div className="text-center">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <h1
        className={`mt-1 font-semibold tracking-tight text-foreground ${large ? 'text-4xl' : 'text-2xl'}`}
      >
        {title}
      </h1>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>}
    </div>
  );
}

/** A confirmed payment, as a receipt. */
export function PaymentSuccess({ payment, back }: { payment: PaymentStatus; back: string }) {
  const title = payment.title || FALLBACK_TITLE[payment.kind];
  const next = NEXT[payment.kind];
  const method = [
    payment.channel ? (CHANNEL[payment.channel] ?? payment.channel) : null,
    payment.provider ? `via ${PROVIDER[payment.provider]}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const items: DescriptionItem[] = [
    { label: 'Paid for', value: title },
    ...(payment.dueDate ? [{ label: 'Due', value: lagosDate(payment.dueDate) }] : []),
    ...(payment.paidAt ? [{ label: 'Paid on', value: lagosDateTime(payment.paidAt) }] : []),
    ...(method ? [{ label: 'Paid with', value: method }] : []),
    { label: 'Amount', value: formatCurrency(payment.amount) },
    ...(payment.fee ? [{ label: 'Card or bank fee', value: formatCurrency(payment.fee) }] : []),
    ...(payment.totalCharged && payment.totalCharged !== payment.amount
      ? [
          {
            label: <span className="font-medium text-foreground">Total charged</span>,
            value: <span className="text-base">{formatCurrency(payment.totalCharged)}</span>,
          },
        ]
      : []),
    { label: 'Reference', value: <Reference value={payment.reference} /> },
  ];

  return (
    <Shell>
      <div className="space-y-4">
        <StatusMark icon={CheckCircle2} tone="success" />
        <Heading
          eyebrow="Payment successful"
          large
          title={formatCurrency(payment.amount)}
          body={`Your ${WHAT[payment.kind]} is confirmed. A receipt is in your payment history.`}
        />
      </div>

      <Card className="px-5 py-1">
        <DescriptionList layout="rows" items={items} />
      </Card>

      <Card className="flex gap-3 border-success/30 bg-success/5 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">{next.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{next.body}</p>
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button href={back} className="w-full sm:flex-1">
          {payment.kind === 'RENT' || payment.kind === 'FLEX' ? 'View my payments' : 'Continue'}
        </Button>
        <Button href="/" variant="outline" className="w-full sm:flex-1">
          <Home className="h-4 w-4" />
          Go to dashboard
        </Button>
      </div>
    </Shell>
  );
}

/** What the attempt was for, so a payer who is worried has something concrete. */
function AttemptSummary({ payment }: { payment: PaymentStatus }) {
  return (
    <Card className="px-5 py-1">
      <DescriptionList
        layout="rows"
        items={[
          { label: 'For', value: payment.title || FALLBACK_TITLE[payment.kind] },
          { label: 'Amount', value: formatCurrency(payment.amount) },
          { label: 'Reference', value: <Reference value={payment.reference} /> },
        ]}
      />
    </Card>
  );
}

export function PaymentConfirming({ kind }: { kind?: PaymentKind }) {
  return (
    <Shell>
      <div className="space-y-4">
        <StatusMark icon={Loader2} tone="muted" spin />
        <Heading
          eyebrow="Almost there"
          title={`Confirming your ${kind ? WHAT[kind] : 'payment'}`}
          body="This usually takes a few seconds. You can leave this page: it won't affect your payment, and you won't be charged twice."
        />
      </div>
    </Shell>
  );
}

export function PaymentStillPending({ payment, back }: { payment: PaymentStatus; back: string }) {
  const kind = payment.kind;
  return (
    <Shell>
      <div className="space-y-4">
        <StatusMark icon={Clock} tone="warning" />
        <Heading
          eyebrow="Still confirming"
          title="Your bank hasn't confirmed this yet"
          body={`If you were charged, your ${WHAT[kind]} will show as paid automatically and we'll let you know. Please don't pay again.`}
        />
      </div>
      <AttemptSummary payment={payment} />
      <Button href={back} variant="outline" className="w-full">
        Back to GetRentos
      </Button>
    </Shell>
  );
}

export function PaymentFailed({ payment, back }: { payment: PaymentStatus; back: string }) {
  return (
    <Shell>
      <div className="space-y-4">
        <StatusMark icon={XCircle} tone="danger" />
        <Heading
          eyebrow="Payment not completed"
          title="This payment didn't go through"
          body="Nothing was taken for this attempt. You can try again, or choose another way to pay."
        />
      </div>
      <AttemptSummary payment={payment} />
      <Button href={back} className="w-full">
        Try again
      </Button>
    </Shell>
  );
}

export function PaymentNotFound() {
  return (
    <Shell>
      <div className="space-y-4">
        <StatusMark icon={XCircle} tone="muted" />
        <Heading
          title="We couldn't find that payment"
          body="If you were charged, it will show on your account once it's confirmed. Please don't pay again."
        />
      </div>
      <Button href="/" variant="outline" className="w-full">
        Back to GetRentos
      </Button>
    </Shell>
  );
}

/**
 * Not signed in here, so the outcome can't be looked up: most often the payer
 * paid from the mobile app's in-app browser, sometimes a web session expired
 * during checkout. Neutral on purpose: nothing here says the payment worked.
 */
export function PaymentDoneElsewhere() {
  return (
    <Shell>
      <div className="space-y-4">
        <StatusMark icon={Smartphone} tone="muted" />
        <Heading
          title="Go back to the app to see how it went"
          body="Close this page and return to the GetRentos app. Your payment shows there once it's confirmed. If you were charged, please don't pay again."
        />
      </div>
      <Button href={withNext(ROUTES.LOGIN, currentPath())} variant="outline" className="w-full">
        Paid on the website? Sign in to check
      </Button>
    </Shell>
  );
}
