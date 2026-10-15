'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, PauseCircle, Upload } from 'lucide-react';
import { Badge, Button, Input, Textarea } from '@getrentos/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landDisputeKeys, landDisputeService } from '@/services/landDisputeService';
import { LAND_DISPUTE_KINDS, type LandDispute } from '@/types/landDispute';

const LIVE = new Set(['OPEN', 'UNDER_INVESTIGATION', 'APPEALED']);
const words = (value: string) => value.replace(/_/g, ' ').toLowerCase();

/** One land dispute, as a party sees it: add evidence while it is live, appeal once when decided. */
export default function LandDisputePage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fileNote, setFileNote] = useState('');
  const [appeal, setAppeal] = useState('');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const key = landDisputeKeys.detail(disputeId);
  const query = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landDisputeService.get(disputeId)),
  });
  const refresh = (updated: LandDispute, text: string) => {
    queryClient.setQueryData(key, updated);
    void queryClient.invalidateQueries({ queryKey: landDisputeKeys.mine });
    setMessage({ text });
  };

  const upload = useMutation({
    mutationFn: () => unwrap(landDisputeService.addEvidence(disputeId, file as File, fileNote)),
    onSuccess: (d) => {
      setFile(null);
      setFileNote('');
      refresh(d, 'Evidence added. It is kept with the case permanently.');
    },
    onError: (e: Error) => setMessage({ text: e.message, error: true }),
  });
  const submitAppeal = useMutation({
    mutationFn: () => unwrap(landDisputeService.appeal(disputeId, appeal.trim())),
    onSuccess: (d) => {
      setAppeal('');
      refresh(d, 'Appeal sent. A different member of our team will review the decision.');
    },
    onError: (e: Error) => setMessage({ text: e.message, error: true }),
  });

  const d = query.data;
  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-24">
        <Link
          href="/land/disputes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Land disputes
        </Link>
        {query.isLoading ? (
          <div className="h-48 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
        ) : !d ? (
          <p className="text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : 'Case not found.'}
          </p>
        ) : (
          <>
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-2xl font-semibold text-foreground">{d.reference}</h1>
                <Badge variant="info">{words(d.status)}</Badge>
                {d.holdActive && (
                  <Badge variant="warning" icon={<PauseCircle className="h-3.5 w-3.5" />}>
                    Land on hold
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {LAND_DISPUTE_KINDS.find((k) => k.value === d.kind)?.label ?? d.kind} ·{' '}
                {d.propertyTitle}
                {d.purchaseReference && ` · purchase ${d.purchaseReference}`} · opened{' '}
                {formatDate(d.createdAt)}
              </p>
            </header>

            {message && (
              <p
                className={`rounded-xl p-3 text-sm ${message.error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-foreground'}`}
                role="status"
              >
                {message.text}
              </p>
            )}

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">The complaint</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{d.description}</p>
              {d.holdActive && d.holdReason && (
                <p className="mt-3 text-sm text-muted-foreground">
                  The land is off the market while this is investigated: {d.holdReason}
                </p>
              )}
            </section>

            {(d.outcome || d.appealReason) && (
              <section className="rounded-2xl border border-border bg-card p-5 text-sm">
                <h2 className="font-semibold text-foreground">Decision</h2>
                {d.outcome && (
                  <p className="mt-2 text-foreground">
                    {d.outcome === 'UPHELD' ? 'Upheld' : 'Dismissed'}
                    {d.decidedAt && ` on ${formatDate(d.decidedAt)}`}: {d.decision}
                  </p>
                )}
                {d.appealReason && (
                  <p className="mt-2 text-muted-foreground">Appealed: {d.appealReason}</p>
                )}
                {d.appealOutcome && (
                  <p className="mt-2 text-foreground">
                    Appeal {d.appealOutcome === 'UPHELD' ? 'upheld' : 'dismissed'}:{' '}
                    {d.appealDecision}
                  </p>
                )}
              </section>
            )}

            {d.canAppeal && (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground">Appeal this decision</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Once only{d.appealDeadline ? `, by ${formatDate(d.appealDeadline)}` : ''}. A
                  different member of our team reviews it.
                </p>
                <Textarea
                  className="mt-3"
                  value={appeal}
                  onChange={(e) => setAppeal(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Why the decision is wrong, and what was missed"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    disabled={appeal.trim().length < 20 || submitAppeal.isPending}
                    isLoading={submitAppeal.isPending}
                    onClick={() => submitAppeal.mutate()}
                  >
                    Send appeal
                  </Button>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4" /> Evidence
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Your own files and our team&apos;s. Files cannot be removed once added.
              </p>
              {d.evidence.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No evidence yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {d.evidence.map((item) => (
                    <li key={item.id} className="text-sm">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {item.fileName}
                      </a>
                      <span className="text-muted-foreground">
                        {' '}
                        · {item.source === 'ADMIN' ? 'GetRentos' : 'you'} ·{' '}
                        {formatDate(item.createdAt)}
                      </span>
                      {item.note && <p className="text-muted-foreground">“{item.note}”</p>}
                    </li>
                  ))}
                </ul>
              )}
              {LIVE.has(d.status) && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <input
                    type="file"
                    aria-label="Evidence file"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-sm"
                  />
                  <Input
                    value={fileNote}
                    onChange={(e) => setFileNote(e.target.value)}
                    placeholder="What this shows (optional)"
                    maxLength={1000}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!file || upload.isPending}
                    isLoading={upload.isPending}
                    onClick={() => upload.mutate()}
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Add evidence
                  </Button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">What has happened</h2>
              <ol className="mt-3 space-y-2 text-sm">
                {d.events.map((event) => (
                  <li key={event.id}>
                    <span className="font-medium text-foreground">{words(event.action)}</span>
                    <span className="text-muted-foreground"> · {formatDate(event.createdAt)}</span>
                    {event.note && (
                      <p className="whitespace-pre-wrap text-muted-foreground">{event.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
