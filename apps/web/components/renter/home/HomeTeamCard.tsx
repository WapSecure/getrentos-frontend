'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { CurrencyInput } from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { SUPPORT, hasSupportLine } from '@/lib/support';
import {
  checkContact,
  homeTeam,
  reportImpersonation,
  type CheckKind,
  type CheckResult,
  type ImpersonationChannel,
} from '@/services/homeTeamService';

const field =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

const CHANNELS: { value: ImpersonationChannel; label: string }[] = [
  { value: 'PHONE', label: 'Phone call or SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'BANK_ACCOUNT', label: 'Asked me to pay a bank account' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'OTHER', label: 'Something else' },
];

const Verdict = ({ result }: { result: CheckResult }) => {
  if (result.verdict === 'VERIFIED') {
    return (
      <p className="flex items-start gap-1.5 rounded-lg bg-success/10 p-3 text-sm text-foreground">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
        This is {result.name}, {result.role.toLowerCase()} for {result.propertyTitle}. Even so, only
        pay rent in GetRentos.
      </p>
    );
  }
  if (result.verdict === 'NEVER_PAY_OUTSIDE') {
    return (
      <p className="flex items-start gap-1.5 rounded-lg bg-destructive/10 p-3 text-sm text-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
        Do not pay into any bank account, whoever asks. Your landlord and manager are paid by
        GetRentos; you pay only in GetRentos. If someone asked you to pay this account, report it
        below.
      </p>
    );
  }
  if (result.verdict === 'INVALID') {
    return <p className="text-sm text-destructive">{result.message}</p>;
  }
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-destructive/10 p-3 text-sm text-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
      This is not anyone who manages your home. Do not pay them or share codes or documents. Report
      it below.
    </p>
  );
};

/**
 * Who really manages the tenant's home, and how to tell an impostor: the
 * verified landlord and managers (contacts shown partly, to compare against),
 * the rule that rent is paid only in GetRentos, a check for any number or
 * email someone used, and a report that reaches GetRentos and the real
 * landlord.
 */
export const HomeTeamCard = () => {
  const team = useQuery({ queryKey: ['renter', 'home-team'], queryFn: () => unwrap(homeTeam()) });
  const [kind, setKind] = useState<CheckKind>('PHONE');
  const [value, setValue] = useState('');
  const [reporting, setReporting] = useState(false);
  const [channel, setChannel] = useState<ImpersonationChannel>('PHONE');
  const [contactValue, setContactValue] = useState('');
  const [claimedToBe, setClaimedToBe] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [paid, setPaid] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportLeaseId, setReportLeaseId] = useState('');

  const check = useMutation({ mutationFn: () => unwrap(checkContact(kind, value.trim())) });
  const report = useMutation({
    mutationFn: () =>
      unwrap(
        reportImpersonation({
          leaseId: reportLeaseId || team.data?.[0]?.leaseId,
          channel,
          contactValue: contactValue.trim() || undefined,
          claimedToBe: claimedToBe.trim(),
          description: description.trim(),
          ...(amount > 0 ? { amountAsked: amount } : {}),
          paid,
        })
      ),
    onSuccess: () => {
      setReported(true);
      setReporting(false);
    },
  });

  const homes = team.data ?? [];
  if (team.isLoading || homes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        Who manages your home
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        These are the only people verified to act for your home. Anyone else claiming to be your
        landlord, a new manager or GetRentos is not.
      </p>

      <div className="mt-4 space-y-4">
        {homes.map((h) => (
          <div key={h.leaseId}>
            <p className="text-sm font-medium text-foreground">
              {h.propertyTitle}
              {h.managedBy && (
                <span className="text-muted-foreground"> · managed by {h.managedBy}</span>
              )}
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {h.people.map((p) => (
                <li key={`${p.name}-${p.role}`} className="rounded-xl border border-border p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.role}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[p.phone && `Phone ${p.phone}`, p.email].filter(Boolean).join(' · ') ||
                      'Reach them in Messages'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
        <p className="font-medium">Pay rent only in GetRentos.</p>
        <p className="mt-1 text-muted-foreground">
          Use{' '}
          <Link href={ROUTES.RENTER_PAYMENTS} className="font-medium text-primary hover:underline">
            Payments
          </Link>
          . GetRentos never asks you to pay into a personal account, and a change of manager never
          changes how you pay.
          {hasSupportLine() && (
            <>
              {' '}
              GetRentos support only contacts you from{' '}
              {[SUPPORT.phone, SUPPORT.whatsapp].filter(Boolean).join(' or ')}.
            </>
          )}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">Check a contact</h3>
        <p className="text-xs text-muted-foreground">
          Someone called, messaged or sent account details? Check them before you do anything.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select
            aria-label="What to check"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as CheckKind);
              check.reset();
            }}
            className={`${field} sm:w-44`}
          >
            <option value="PHONE">Phone number</option>
            <option value="EMAIL">Email address</option>
            <option value="BANK_ACCOUNT">Bank account</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              kind === 'EMAIL'
                ? 'name@example.com'
                : kind === 'PHONE'
                  ? '0803 123 4567'
                  : 'Account number'
            }
            className={field}
          />
          <button
            type="button"
            disabled={value.trim().length < 3 || check.isPending}
            onClick={() => check.mutate()}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {check.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Check
          </button>
        </div>
        <div className="mt-2">
          {check.data && <Verdict result={check.data} />}
          {check.error && (
            <p className="text-sm text-destructive">{(check.error as Error).message}</p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {reported ? (
          <p className="flex items-start gap-1.5 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            Thank you. GetRentos will look into it, and your landlord and manager have been warned
            (without your name). If you already paid, also report it to your bank now.
          </p>
        ) : !reporting ? (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="text-sm font-medium text-destructive hover:underline"
          >
            Report someone posing as your landlord, manager or GetRentos
          </button>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Report an impostor</h3>
            {homes.length > 1 && (
              <select
                aria-label="Which home"
                value={reportLeaseId || homes[0].leaseId}
                onChange={(e) => setReportLeaseId(e.target.value)}
                className={field}
              >
                {homes.map((h) => (
                  <option key={h.leaseId} value={h.leaseId}>
                    {h.propertyTitle}
                  </option>
                ))}
              </select>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                aria-label="How they contacted you"
                value={channel}
                onChange={(e) => setChannel(e.target.value as ImpersonationChannel)}
                className={field}
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder="Their number, email or account (optional)"
                className={field}
              />
              <input
                value={claimedToBe}
                onChange={(e) => setClaimedToBe(e.target.value)}
                placeholder="Who they said they were"
                className={field}
              />
              <CurrencyInput
                prefix="₦"
                value={amount || ''}
                onValueChange={setAmount}
                placeholder="Amount asked for (optional)"
              />
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened"
              className={field}
            />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              I already paid them
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  claimedToBe.trim().length < 2 ||
                  description.trim().length < 10 ||
                  report.isPending
                }
                onClick={() => report.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
              >
                {report.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Send report
              </button>
              <button
                type="button"
                onClick={() => setReporting(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            {report.error && (
              <p className="text-sm text-destructive">{(report.error as Error).message}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
