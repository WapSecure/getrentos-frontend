'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Copy,
  ExternalLink,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserRoundPlus,
} from '@sureground/icons';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  type Column,
} from '@sureground/ui';
import { cn } from '@sureground/shared';
import type { DiasporaQueueItem } from '@/types/diaspora';
import {
  DIASPORA_QUEUE_KIND_ICON,
  DIASPORA_QUEUE_KIND_LABEL,
  describeDue,
  diasporaStatusLabel,
  type DiasporaQueueGroup,
} from '@/lib/diasporaQueue';
import { IconTile } from '@/components/admin/ops/OpsParts';

interface DiasporaQueueTableProps {
  groups: DiasporaQueueGroup[];
  currentUserId?: string;
  canAssign: boolean;
  /** The item being taken right now, so only its button shows progress. */
  pendingId?: string;
  onOpen: (item: DiasporaQueueItem) => void;
  onTake: (item: DiasporaQueueItem) => void;
  onAssign: (item: DiasporaQueueItem) => void;
  onCopyLink: (item: DiasporaQueueItem) => void;
  onInvestor: (item: DiasporaQueueItem) => void;
}

const dueTone = {
  overdue: 'font-medium text-destructive',
  soon: 'font-medium text-warning',
  ok: 'text-foreground',
  none: 'text-muted-foreground',
} as const;

/** Clicks on controls inside a clickable row must not open the row as well. */
const stop = (event: MouseEvent) => event.stopPropagation();

function DueCell({ item }: { item: DiasporaQueueItem }) {
  const due = describeDue(item.dueAt, item.overdue);
  return (
    <div className="whitespace-nowrap">
      <p className={cn('flex items-center gap-1.5 text-sm', dueTone[due.tone])}>
        {due.label}
        {item.overdue && item.escalationLevel >= 2 && (
          <Badge variant="danger" title="The ops lead has been told">
            Escalated
          </Badge>
        )}
      </p>
      {due.date && <p className="mt-0.5 text-xs text-muted-foreground">{due.date}</p>}
    </div>
  );
}

function Person({ name, tone = 'primary' }: { name: string; tone?: 'primary' | 'neutral' }) {
  return (
    <span className="flex min-w-0 items-center gap-2 whitespace-nowrap text-sm text-foreground">
      <Avatar name={name} size="xs" tone={tone} />
      <span className="truncate">{name}</span>
    </span>
  );
}

function AssigneeCell({
  items,
  currentUserId,
}: {
  items: DiasporaQueueItem[];
  currentUserId?: string;
}) {
  const ids = new Set(items.map((item) => item.assignedTo?.id ?? ''));
  if (ids.size > 1) {
    return <span className="whitespace-nowrap text-sm text-muted-foreground">Several people</span>;
  }
  const assignee = items[0].assignedTo;
  if (!assignee) return <span className="text-sm text-muted-foreground">Unassigned</span>;
  return <Person name={assignee.id === currentUserId ? 'You' : assignee.name} tone="neutral" />;
}

export const DiasporaQueueTable = ({
  groups,
  currentUserId,
  canAssign,
  pendingId,
  onOpen,
  onTake,
  onAssign,
  onCopyLink,
  onInvestor,
}: DiasporaQueueTableProps) => {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Take when nobody has it yet; everything else sits in one overflow menu. */
  const itemActions = (item: DiasporaQueueItem) => {
    const mine = item.assignedTo?.id === currentUserId;
    return (
      <div className="flex items-center justify-end gap-1" onClick={stop}>
        {canAssign && !item.assignedTo && (
          <Button
            size="xs"
            onClick={() => onTake(item)}
            disabled={Boolean(pendingId)}
            isLoading={pendingId === item.id}
            aria-label={`Take ${item.title}`}
          >
            Take
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              size="sm"
              label="More actions"
              aria-label={`More actions for ${item.title}`}
              icon={<MoreHorizontal />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {canAssign && item.assignedTo && !mine && (
              <DropdownMenuItem onSelect={() => onTake(item)} disabled={Boolean(pendingId)}>
                <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Take it over
              </DropdownMenuItem>
            )}
            {canAssign && (
              <DropdownMenuItem onSelect={() => onAssign(item)} disabled={Boolean(pendingId)}>
                <UserRoundPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Assign to someone
              </DropdownMenuItem>
            )}
            {canAssign && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => onOpen(item)}>
              <ExternalLink className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopyLink(item)}>
              <Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Copy link
            </DropdownMenuItem>
            {item.investorId && (
              <DropdownMenuItem onSelect={() => onInvestor(item)}>
                <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Only this investor
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const columns: Column<DiasporaQueueGroup>[] = [
    {
      key: 'item',
      header: 'Item',
      render: ({ key, items }) => {
        const lead = items[0];
        const Icon = DIASPORA_QUEUE_KIND_ICON[lead.kind];
        const isGroup = items.length > 1;
        const open = expanded.has(key);
        return (
          <div className="flex min-w-[16rem] items-center gap-3">
            <IconTile size="sm">
              <Icon />
            </IconTile>
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <Link
                  href={lead.link.path}
                  onClick={stop}
                  className="line-clamp-2 font-medium text-foreground hover:text-primary hover:underline"
                >
                  {lead.title}
                </Link>
                {isGroup && (
                  <Badge variant="primary" className="shrink-0">
                    <span aria-hidden="true">×{items.length}</span>
                    <span className="sr-only">{items.length} items</span>
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                {DIASPORA_QUEUE_KIND_LABEL[lead.kind]}
                {isGroup && (
                  <>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        stop(event);
                        toggle(key);
                      }}
                      aria-expanded={open}
                      className="inline-flex items-center gap-0.5 rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {open ? 'Hide items' : 'Show items'}
                      <ChevronRight
                        aria-hidden="true"
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-150',
                          open && 'rotate-90'
                        )}
                      />
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'investor',
      header: 'Investor',
      render: ({ items }) => {
        const lead = items[0];
        return lead.investorId ? (
          <button
            type="button"
            onClick={(event) => {
              stop(event);
              onInvestor(lead);
            }}
            className="rounded-sm text-left hover:[&_span]:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Show only items for ${lead.investorName ?? 'this investor'}`}
          >
            <Person name={lead.investorName ?? 'Investor'} />
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">Not linked</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: ({ items }) => {
        const statuses = new Set(items.map((item) => item.status));
        return (
          <Badge variant="neutral" dot>
            {statuses.size > 1 ? 'Mixed' : diasporaStatusLabel(items[0].status)}
          </Badge>
        );
      },
    },
    {
      key: 'due',
      header: 'Due (Lagos)',
      render: ({ items }) => <DueCell item={items[0]} />,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: ({ items }) => <AssigneeCell items={items} currentUserId={currentUserId} />,
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: ({ key, items }) =>
        items.length > 1 ? (
          <div className="flex justify-end" onClick={stop}>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => toggle(key)}
              aria-expanded={expanded.has(key)}
            >
              {expanded.has(key) ? 'Hide' : `Review ${items.length}`}
            </Button>
          </div>
        ) : (
          itemActions(items[0])
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={groups}
      getRowKey={(group) => group.items[0].id}
      onRowClick={(group) => (group.items.length > 1 ? toggle(group.key) : onOpen(group.items[0]))}
      density="compact"
      minWidth="56rem"
      maxHeight="min(72vh, 52rem)"
      caption="Diaspora operations queue, overdue items first"
      renderExpanded={(group) =>
        group.items.length > 1 && expanded.has(group.key) ? (
          <ul
            aria-label={`${group.items.length} items: ${group.items[0].title}`}
            className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border bg-card"
          >
            {group.items.map((item, index) => (
              <li
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-2 sm:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
              >
                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                  {index + 1} of {group.items.length}
                </span>
                <DueCell item={item} />
                <span className="hidden sm:block">
                  <Badge variant="neutral" dot>
                    {diasporaStatusLabel(item.status)}
                  </Badge>
                </span>
                <span className="hidden sm:block">
                  <AssigneeCell items={[item]} currentUserId={currentUserId} />
                </span>
                {itemActions(item)}
              </li>
            ))}
          </ul>
        ) : null
      }
    />
  );
};
