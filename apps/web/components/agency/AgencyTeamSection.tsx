'use client';

import { useState } from 'react';
import { Users } from '@sureground/icons';
import {
  Button,
  DataTable,
  EmptyState,
  ListSkeleton,
  NumberInput,
  type Column,
} from '@sureground/ui';
import { formatCurrency } from '@/lib/format';
import type { AgencyTeam, AgencyTeamMember } from '@/services/agencyCommissionService';

type TeamRow =
  | { kind: 'member'; member: AgencyTeamMember }
  | { kind: 'unassigned'; deals: number; commissionTotal: number };

export function AgencyTeamSection({
  team,
  isLoading,
  onSetSplit,
  savingUserId,
}: {
  team: AgencyTeam | undefined;
  isLoading: boolean;
  onSetSplit: (userId: string, splitPct: number) => void;
  savingUserId?: string | null;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({});

  const columns: Column<TeamRow>[] = [
    {
      key: 'agent',
      header: 'Agent',
      render: (row) => {
        if (row.kind === 'unassigned') {
          return <span className="text-muted-foreground">Unassigned</span>;
        }
        const m = row.member;
        return (
          <>
            <span className="block text-foreground">{m.name ?? m.email ?? 'Agent'}</span>
            <span className="block text-xs text-muted-foreground">{m.role.toLowerCase()}</span>
          </>
        );
      },
    },
    {
      key: 'split',
      header: 'Split %',
      render: (row) => {
        if (row.kind === 'unassigned') return null;
        const m = row.member;
        const edited = edits[m.userId];
        const value = edited ?? String(m.splitPct);
        const dirty = edited !== undefined && Number(edited) !== m.splitPct;
        return (
          <div className="flex items-center gap-2">
            <NumberInput
              value={value}
              onValueChange={(v) => setEdits((e) => ({ ...e, [m.userId]: v }))}
              className="w-20"
              aria-label={`Split % for ${m.name ?? m.email ?? 'agent'}`}
            />
            {dirty && (
              <Button
                size="sm"
                onClick={() => onSetSplit(m.userId, Number(value))}
                isLoading={savingUserId === m.userId}
              >
                Save
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: 'deals',
      header: 'Deals',
      numeric: true,
      className: 'text-muted-foreground',
      render: (row) => (row.kind === 'member' ? row.member.deals : row.deals),
    },
    {
      key: 'commission',
      header: 'Commission',
      numeric: true,
      className: 'text-muted-foreground',
      render: (row) =>
        formatCurrency(row.kind === 'member' ? row.member.commissionTotal : row.commissionTotal),
    },
    {
      key: 'share',
      header: 'Their share',
      numeric: true,
      className: 'font-medium text-foreground',
      render: (row) => (row.kind === 'member' ? formatCurrency(row.member.shareTotal) : null),
    },
  ];

  return (
    <div className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Users className="h-4 w-4 text-muted-foreground" />
        Team &amp; splits
      </h2>
      {isLoading || !team || team.members.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          {isLoading ? (
            <ListSkeleton rows={3} label="Loading your team" className="rounded-none border-0" />
          ) : (
            <EmptyState
              icon={Users}
              title="No team members yet"
              description="Your agency's members and their commission splits will appear here."
              size="compact"
              bare
            />
          )}
        </div>
      ) : (
        <DataTable
          caption="Team members and their commission splits"
          density="compact"
          columns={columns}
          data={[
            ...team.members.map((member): TeamRow => ({ kind: 'member', member })),
            ...(team.unassigned.deals > 0
              ? [{ kind: 'unassigned', ...team.unassigned } satisfies TeamRow]
              : []),
          ]}
          getRowKey={(row) => (row.kind === 'member' ? row.member.userId : 'unassigned')}
          getRowClassName={(row) => (row.kind === 'unassigned' ? 'bg-muted/30' : undefined)}
        />
      )}
    </div>
  );
}
