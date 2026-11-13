'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDualTime } from '@sureground/shared';
import { FileText, MessageSquareText, Send, Upload } from '@sureground/icons';
import {
  Badge,
  Button,
  DocumentUpload,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Skeleton,
  Textarea,
  useToast,
  type PendingUpload,
} from '@sureground/ui';
import { browserTimeZone } from '@/components/shared/forms/TimeZoneSelect';
import { unwrap } from '@/lib/apiHelpers';
import { getStoredUser } from '@/lib/authStorage';
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { formatDate } from '@/lib/format';
import { transactionWorkspaceKeys } from '@/lib/queryKeys';
import { transactionWorkspaceService } from '@/services/transactionWorkspaceService';
import {
  DisputeLoading,
  DisputeMissing,
  DisputeRespondBy,
  DisputeSection,
  SALE_DISPUTE_STATUS,
} from './DisputeParts';

const MAX_MESSAGE = 2000;
const MAX_NOTE = 1000;
/** The backend's evidence limit and the file types it accepts. */
const EVIDENCE_MAX_MB = 25;
const EVIDENCE_ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.csv,.xls,.xlsx,.mp4,.webm';

/** Only plain web links from older disputes are shown, and never previewed. */
const isWebLink = (value: string) => /^https?:\/\//i.test(value);

/**
 * A deposit dispute's thread for one of its two parties: what was raised, the messages with the
 * other side and Sureground, both parties' files, a reply box and evidence upload while it is open,
 * and Sureground's response deadline. The buyer and the seller see the same page from their side.
 * The model has no appeal, so the page says decisions are final and points to the transparency centre.
 */
export const DepositDisputeThread = ({
  disputeId,
  back,
  workspaceHref,
}: {
  disputeId: string;
  back: { label: string; href: string };
  /** The purchase workspace; the seller has none, so the sale is shown without a link. */
  workspaceHref?: (transactionId: string) => string;
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [fileNote, setFileNote] = useState('');
  const file = uploads[0]?.file ?? null;
  const [viewerTimeZone] = useState(() => browserTimeZone());
  const [myId] = useState(() => getStoredUser<{ id?: string }>()?.id);

  const disputeKey = transactionWorkspaceKeys.saleDispute(disputeId);
  const dispute = useQuery({
    queryKey: disputeKey,
    queryFn: () => unwrap(transactionWorkspaceService.saleDispute(disputeId)),
    enabled: Boolean(disputeId),
  });
  const messagesKey = transactionWorkspaceKeys.saleDisputeMessages(disputeId);
  const messages = useQuery({
    queryKey: messagesKey,
    queryFn: () => unwrap(transactionWorkspaceService.saleDisputeMessages(disputeId)),
    enabled: dispute.isSuccess,
  });
  const send = useMutation({
    mutationFn: () => unwrap(transactionWorkspaceService.sendSaleDisputeMessage(disputeId, reply)),
    onSuccess: () => {
      setReply('');
      void queryClient.invalidateQueries({ queryKey: messagesKey });
    },
    onError: (reason: Error) => toast.error(reason.message),
  });
  const upload = useMutation({
    mutationFn: () =>
      unwrap(transactionWorkspaceService.addSaleDisputeEvidence(disputeId, file as File, fileNote)),
    onSuccess: (updated) => {
      setUploads([]);
      setFileNote('');
      queryClient.setQueryData(disputeKey, updated);
      toast.success('File added. It is kept with the dispute permanently.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  if (dispute.isLoading) return <DisputeLoading />;
  const d = dispute.data;
  if (!d)
    return <DisputeMissing error={dispute.error} backHref={back.href} backLabel={back.label} />;

  const resolved = d.status === 'RESOLVED';
  const otherSide = d.raisedBy.id === myId ? d.against.legalName : d.raisedBy.legalName;
  const links = (d.evidence ?? []).filter(isWebLink);
  const attachments = d.attachments ?? [];
  const at = (iso: string) => `${formatDate(iso)}, ${formatDualTime(iso, viewerTimeZone)}`;
  const author = (senderId: string, senderName: string) => {
    if (senderId === myId) return 'You';
    if (senderId === d.raisedBy.id || senderId === d.against.id) return senderName;
    return 'Sureground';
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[
          back,
          {
            label: d.propertyTitle ?? 'Purchase',
            href: workspaceHref?.(d.transactionId),
          },
          { label: 'Deposit dispute' },
        ]}
        title={d.title}
        description={`Deposit dispute${d.propertyTitle ? ` · ${d.propertyTitle}` : ''} · opened ${formatDate(d.createdAt)}`}
        meta={
          <Badge variant={resolved ? 'neutral' : 'warning'}>
            {SALE_DISPUTE_STATUS[d.status] ?? d.status}
          </Badge>
        }
      />

      <DisputeRespondBy respondBy={d.respondBy} viewerTimeZone={viewerTimeZone} />

      <DisputeSection
        title="The dispute"
        description={`Raised by ${d.raisedBy.id === myId ? 'you' : d.raisedBy.legalName}. The deposit stays held until Sureground decides.`}
      >
        {d.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{d.description}</p>
        )}
        {links.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {links.map((href) => (
              <li key={href} className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="truncate text-primary hover:underline"
                >
                  {href}
                </a>
              </li>
            ))}
          </ul>
        )}
      </DisputeSection>

      <DisputeSection
        title="Evidence"
        icon={FileText}
        description={`Files from you and ${otherSide}. Files cannot be removed once added.`}
      >
        {attachments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No files yet"
            description={
              resolved
                ? 'Nobody added a file to this dispute.'
                : 'Photos, documents or receipts that support what you have said.'
            }
            size="compact"
            bare
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {attachments.map((item) => (
              <li key={item.id} className="text-sm">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {item.name}
                </a>
                <span className="text-muted-foreground">
                  {' '}
                  ·{' '}
                  {item.uploadedBy?.id === myId
                    ? 'you'
                    : (item.uploadedBy?.legalName ?? otherSide)}{' '}
                  · {formatDate(item.uploadedAt)}
                </span>
                {item.note && <p className="text-muted-foreground">“{item.note}”</p>}
              </li>
            ))}
          </ul>
        )}
        {!resolved && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <DocumentUpload
              value={uploads}
              onChange={setUploads}
              multiple={false}
              accept={EVIDENCE_ACCEPT}
              maxSizeMB={EVIDENCE_MAX_MB}
              label="Evidence file"
            />
            <Input
              value={fileNote}
              onChange={(e) => setFileNote(e.target.value)}
              placeholder="What this shows (optional)"
              maxLength={MAX_NOTE}
              aria-label="What this file shows"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                icon={<Upload className="h-4 w-4" aria-hidden />}
                isLoading={upload.isPending}
                disabled={!file || upload.isPending}
                onClick={() => upload.mutate()}
              >
                Add file
              </Button>
            </div>
          </div>
        )}
      </DisputeSection>

      {resolved && d.resolution && (
        <DisputeSection title="Decision">
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {d.resolvedAt && `${formatDate(d.resolvedAt)}: `}
            {d.resolution}
          </p>
        </DisputeSection>
      )}

      <DisputeSection
        title="Messages"
        icon={MessageSquareText}
        description={`Between you, ${otherSide} and Sureground. Everything here stays on record.`}
      >
        {messages.isLoading ? (
          <Skeleton className="mt-3 h-16 w-full rounded-xl" />
        ) : (messages.data ?? []).length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title="No messages yet"
            description={
              resolved ? 'Nobody wrote on this dispute.' : 'Add anything Sureground should know.'
            }
            size="compact"
            bare
          />
        ) : (
          <ol className="mt-3 space-y-3">
            {(messages.data ?? []).map((m) => {
              const mine = m.senderId === myId;
              return (
                <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm text-foreground ${
                      mine ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {author(m.senderId, m.senderName)} · {at(m.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {!resolved && (
          <div className="mt-4 border-t border-border pt-4">
            <Field label="Reply">
              <Textarea
                rows={3}
                value={reply}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setReply(e.target.value)}
                placeholder="What happened, and what you want Sureground to know"
              />
            </Field>
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                icon={<Send className="h-4 w-4" aria-hidden />}
                isLoading={send.isPending}
                disabled={reply.trim().length === 0}
                onClick={() => send.mutate()}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </DisputeSection>

      <p className="text-xs text-muted-foreground">
        Decisions on deposit disputes are final within Sureground; see the{' '}
        <Link href={DIASPORA_ROUTES.TRANSPARENCY} className="text-primary hover:underline">
          transparency centre
        </Link>
        .
      </p>
    </div>
  );
};
