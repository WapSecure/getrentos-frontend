'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, PauseCircle, Upload } from '@sureground/icons';
import {
  Badge,
  Button,
  Input,
  Textarea,
  DocumentUpload,
  EmptyState,
  type PendingUpload,
  PageHeader,
} from '@sureground/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { browserTimeZone } from '@/components/shared/forms/TimeZoneSelect';
import {
  DisputeLoading,
  DisputeMissing,
  DisputeRespondBy,
  DisputeSection,
  LAND_DISPUTE_STATUS,
} from '@/components/shared/disputes/DisputeParts';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landDisputeKeys, landDisputeService } from '@/services/landDisputeService';
import { LAND_DISPUTE_KINDS, type LandDispute } from '@/types/landDispute';

const LIVE = new Set(['OPEN', 'UNDER_INVESTIGATION', 'APPEALED']);
const words = (value: string) => value.replace(/_/g, ' ').toLowerCase();

export default function LandDisputePage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const file = uploads[0]?.file ?? null;
  const [fileNote, setFileNote] = useState('');
  const [appeal, setAppeal] = useState('');
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [viewerTimeZone] = useState(() => browserTimeZone());

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
      setUploads([]);
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
        {query.isLoading ? (
          <DisputeLoading />
        ) : !d ? (
          <DisputeMissing error={query.error} backHref="/land/disputes" backLabel="Land disputes" />
        ) : (
          <>
            <PageHeader
              breadcrumbs={[
                { label: 'Land disputes', href: '/land/disputes' },
                { label: d.reference },
              ]}
              title={<span className="font-mono">{d.reference}</span>}
              description={
                <>
                  {LAND_DISPUTE_KINDS.find((k) => k.value === d.kind)?.label ?? d.kind} ·{' '}
                  {d.propertyTitle}
                  {d.purchaseReference && ` · purchase ${d.purchaseReference}`} · opened{' '}
                  {formatDate(d.createdAt)}
                </>
              }
              meta={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{LAND_DISPUTE_STATUS[d.status] ?? words(d.status)}</Badge>
                  {d.holdActive && (
                    <Badge variant="warning" icon={<PauseCircle className="h-3.5 w-3.5" />}>
                      Land on hold
                    </Badge>
                  )}
                </div>
              }
            />

            {message && (
              <p
                className={`rounded-xl p-3 text-sm ${message.error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-foreground'}`}
                role="status"
              >
                {message.text}
              </p>
            )}

            <DisputeRespondBy respondBy={d.respondBy} viewerTimeZone={viewerTimeZone} />

            <DisputeSection title="The complaint">
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{d.description}</p>
              {d.holdActive && d.holdReason && (
                <p className="mt-3 text-sm text-muted-foreground">
                  The land is off the market while this is investigated: {d.holdReason}
                </p>
              )}
            </DisputeSection>

            {(d.outcome || d.appealReason) && (
              <DisputeSection title="Decision">
                {d.outcome && (
                  <p className="mt-2 text-sm text-foreground">
                    {d.outcome === 'UPHELD' ? 'Upheld' : 'Dismissed'}
                    {d.decidedAt && ` on ${formatDate(d.decidedAt)}`}: {d.decision}
                  </p>
                )}
                {d.appealReason && (
                  <p className="mt-2 text-sm text-muted-foreground">Appealed: {d.appealReason}</p>
                )}
                {d.appealOutcome && (
                  <p className="mt-2 text-sm text-foreground">
                    Appeal {d.appealOutcome === 'UPHELD' ? 'upheld' : 'dismissed'}:{' '}
                    {d.appealDecision}
                  </p>
                )}
              </DisputeSection>
            )}

            {d.canAppeal && (
              <DisputeSection
                title="Appeal this decision"
                description={`Once only${d.appealDeadline ? `, by ${formatDate(d.appealDeadline)}` : ''}. A different member of our team reviews it.`}
              >
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
              </DisputeSection>
            )}

            <DisputeSection
              title="Evidence"
              icon={FileText}
              description="Your own files and our team's. Files cannot be removed once added."
            >
              {d.evidence.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No evidence yet"
                  description="Files you or our team add to this dispute will appear here."
                  size="compact"
                  bare
                />
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
                        · {item.source === 'ADMIN' ? 'Sureground' : 'you'} ·{' '}
                        {formatDate(item.createdAt)}
                      </span>
                      {item.note && <p className="text-muted-foreground">“{item.note}”</p>}
                    </li>
                  ))}
                </ul>
              )}
              {LIVE.has(d.status) && (
                <div className="mt-4 space-y-2">
                  <DocumentUpload
                    value={uploads}
                    onChange={setUploads}
                    multiple={false}
                    maxSizeMB={20}
                    label="Evidence file"
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
            </DisputeSection>

            <DisputeSection title="What has happened">
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
            </DisputeSection>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
