'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Pencil } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminSubscriptionService } from '@/services/adminSubscriptionService';
import type {
  EnterpriseLead,
  EnterpriseLeadStatus,
  EnterpriseLeadType,
} from '@/types/subscription';

type Filter = 'ALL' | EnterpriseLeadStatus;

const STATUS: Record<EnterpriseLeadStatus, { label: string; variant: BadgeVariant }> = {
  NEW: { label: 'New', variant: 'info' },
  CONTACTED: { label: 'Contacted', variant: 'warning' },
  WON: { label: 'Won', variant: 'success' },
  LOST: { label: 'Lost', variant: 'neutral' },
};

const STATUS_OPTIONS = (Object.keys(STATUS) as EnterpriseLeadStatus[]).map((value) => ({
  value,
  label: STATUS[value].label,
}));

const TYPE_LABEL: Record<EnterpriseLeadType, string> = {
  AGENCY: 'Agency',
  ESTATE: 'Estate',
  DEVELOPER: 'Developer',
  OWNER: 'Owner',
  OTHER: 'Other',
};

const leadsKey = ['admin', 'enterprise-leads'];

export function EnterpriseEnquiries() {
  const client = useQueryClient();
  const toast = useToast();
  const user = useAdminUser();
  const canManage = hasAdminPermission(user?.roles, 'subscriptions.manage');
  const [filter, setFilter] = useState<Filter>('NEW');
  const [pendingStatus, setPendingStatus] = useState<{
    lead: EnterpriseLead;
    status: EnterpriseLeadStatus;
  } | null>(null);
  const [notesFor, setNotesFor] = useState<EnterpriseLead | null>(null);
  const [notes, setNotes] = useState('');

  const query = useQuery({
    queryKey: [...leadsKey, filter],
    queryFn: () =>
      unwrap(adminSubscriptionService.listEnterpriseLeads(filter === 'ALL' ? undefined : filter)),
    placeholderData: keepPreviousData,
    throwOnError: false,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { status?: EnterpriseLeadStatus; notes?: string };
    }) => unwrap(adminSubscriptionService.updateEnterpriseLead(id, input)),
    onSuccess: (_lead, { input }) => {
      client.invalidateQueries({ queryKey: leadsKey });
      setPendingStatus(null);
      setNotesFor(null);
      toast.success(input.status ? 'Status updated.' : 'Notes saved.');
    },
    onError: (err: Error) => toast.error(err.message || 'Could not update the enquiry.'),
  });

  const leads = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Enterprise enquiries"
        description="Organisations that asked about Enterprise from the pricing page. Newest first."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="NEW">New</TabsTrigger>
          <TabsTrigger value="CONTACTED">Contacted</TabsTrigger>
          <TabsTrigger value="WON">Won</TabsTrigger>
          <TabsTrigger value="LOST">Lost</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load enquiries"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No enquiries here"
          description="Enquiries appear here when someone asks about Enterprise."
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {lead.organizationName}
                    <Badge variant="neutral">{TYPE_LABEL[lead.organizationType]}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Received {formatDate(lead.createdAt)}
                  </p>
                </div>
                <Badge variant={STATUS[lead.status].variant}>{STATUS[lead.status].label}</Badge>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Fact label="Contact" value={lead.contactName} />
                <Fact label="Email" value={lead.email} />
                <Fact label="Phone" value={lead.phone ?? 'Not given'} />
                <Fact label="Size" value={lead.size ?? 'Not given'} />
                {lead.message ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Message</dt>
                    <dd className="whitespace-pre-line text-foreground [overflow-wrap:anywhere]">
                      {lead.message}
                    </dd>
                  </div>
                ) : null}
                {lead.notes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Staff notes</dt>
                    <dd className="whitespace-pre-line text-foreground [overflow-wrap:anywhere]">
                      {lead.notes}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {canManage ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Select
                    value={lead.status}
                    onValueChange={(v) => {
                      if (v !== lead.status) {
                        setPendingStatus({ lead, status: v as EnterpriseLeadStatus });
                      }
                    }}
                    options={STATUS_OPTIONS}
                    ariaLabel={`Status of the enquiry from ${lead.organizationName}`}
                    className="w-44"
                    disabled={update.isPending}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setNotes(lead.notes ?? '');
                      setNotesFor(lead);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {lead.notes ? 'Edit notes' : 'Add notes'}
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && !update.isPending && setPendingStatus(null)}
        title="Change the status?"
        description={
          pendingStatus
            ? `The enquiry from ${pendingStatus.lead.organizationName} moves from ${STATUS[pendingStatus.lead.status].label} to ${STATUS[pendingStatus.status].label}.`
            : ''
        }
        confirmLabel={`Mark as ${pendingStatus ? STATUS[pendingStatus.status].label.toLowerCase() : ''}`}
        tone="primary"
        isLoading={update.isPending}
        onConfirm={() =>
          pendingStatus && !update.isPending
            ? update.mutateAsync({
                id: pendingStatus.lead.id,
                input: { status: pendingStatus.status },
              })
            : undefined
        }
      />

      <ConfirmDialog
        open={notesFor !== null}
        onOpenChange={(open) => !open && !update.isPending && setNotesFor(null)}
        title="Notes on this enquiry"
        description={
          notesFor ? `Only staff can see these notes on ${notesFor.organizationName}.` : ''
        }
        confirmLabel="Save notes"
        tone="primary"
        promptLabel="Notes"
        promptPlaceholder="For example, called on Monday and sent the price sheet"
        promptValue={notes}
        onPromptChange={setNotes}
        isLoading={update.isPending}
        onConfirm={() =>
          notesFor && !update.isPending
            ? update.mutateAsync({ id: notesFor.id, input: { notes: notes.trim() } })
            : undefined
        }
      />
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}
