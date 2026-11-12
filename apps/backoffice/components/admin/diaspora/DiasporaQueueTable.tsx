'use client';

import Link from 'next/link';
import { UserCheck, UserRoundPlus } from '@sureground/icons';
import { Badge, Button, DataTable, type Column } from '@sureground/ui';
import type { DiasporaQueueItem } from '@/types/diaspora';
import {
  DIASPORA_QUEUE_KIND_LABEL,
  diasporaStatusLabel,
  formatLagosDate,
} from '@/lib/diasporaQueue';

interface DiasporaQueueTableProps {
  items: DiasporaQueueItem[];
  isLoading?: boolean;
  currentUserId?: string;
  canAssign: boolean;
  /** The item being assigned right now, so only its buttons show progress. */
  pendingId?: string;
  onTake: (item: DiasporaQueueItem) => void;
  onAssign: (item: DiasporaQueueItem) => void;
  onInvestor: (item: DiasporaQueueItem) => void;
}

export const DiasporaQueueTable = ({
  items,
  isLoading,
  currentUserId,
  canAssign,
  pendingId,
  onTake,
  onAssign,
  onInvestor,
}: DiasporaQueueTableProps) => {
  const columns: Column<DiasporaQueueItem>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <div className="min-w-[16rem]">
          <Link
            href={item.link.path}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {item.title}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {DIASPORA_QUEUE_KIND_LABEL[item.kind]}
          </p>
        </div>
      ),
    },
    {
      key: 'investor',
      header: 'Investor',
      render: (item) =>
        item.investorId ? (
          <button
            type="button"
            onClick={() => onInvestor(item)}
            className="whitespace-nowrap rounded-sm text-left text-sm text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Show only items for ${item.investorName ?? 'this investor'}`}
          >
            {item.investorName ?? 'Investor'}
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">Not linked</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant="neutral" dot>
          {diasporaStatusLabel(item.status)}
        </Badge>
      ),
    },
    {
      key: 'due',
      header: 'Due (Lagos)',
      render: (item) => (
        <div className="flex flex-col items-start gap-1 whitespace-nowrap">
          <span className={`text-sm ${item.overdue ? 'font-medium text-destructive' : ''}`}>
            {item.dueAt ? formatLagosDate(item.dueAt) : 'No deadline'}
          </span>
          {item.overdue && (
            <Badge variant={item.escalationLevel >= 2 ? 'danger' : 'warning'} dot>
              {item.escalationLevel >= 2 ? 'Escalated to ops lead' : 'Overdue'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'assignee',
      header: 'Assigned to',
      render: (item) =>
        item.assignedTo ? (
          <span className="whitespace-nowrap text-sm">
            {item.assignedTo.id === currentUserId ? 'You' : item.assignedTo.name}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        ),
    },
    ...(canAssign
      ? [
          {
            key: 'actions',
            header: 'Actions',
            srHeader: 'Actions',
            align: 'right' as const,
            render: (item: DiasporaQueueItem) => {
              const busy = pendingId === item.id;
              return (
                <div className="flex justify-end gap-1.5">
                  {item.assignedTo?.id !== currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTake(item)}
                      disabled={Boolean(pendingId)}
                      isLoading={busy}
                      icon={<UserCheck className="h-4 w-4" />}
                    >
                      Take
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssign(item)}
                    disabled={Boolean(pendingId)}
                    icon={<UserRoundPlus className="h-4 w-4" />}
                  >
                    Assign
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowKey={(item) => item.id}
      isLoading={isLoading}
      density="compact"
      caption="Diaspora operations queue, overdue items first"
    />
  );
};
