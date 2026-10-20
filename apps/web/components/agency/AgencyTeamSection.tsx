'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button, ListSkeleton, NumberInput } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { AgencyTeam } from '@/services/agencyCommissionService';

/**
 * The firm's agents and how commissions divide across them. Each agent has a
 * default split % of the commissions credited to them; the table rolls up their
 * deals, the firm commission on those, and the agent's share. Unassigned
 * commissions sit in their own row until credited.
 */
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

  return (
    <div className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Users className="h-4 w-4 text-muted-foreground" />
        Team &amp; splits
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        {isLoading ? (
          <ListSkeleton rows={3} label="Loading your team" className="rounded-none border-0" />
        ) : !team || team.members.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Agent</th>
                <th className="px-4 py-2.5 font-medium">Split %</th>
                <th className="px-4 py-2.5 text-right font-medium">Deals</th>
                <th className="px-4 py-2.5 text-right font-medium">Commission</th>
                <th className="px-4 py-2.5 text-right font-medium">Their share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {team.members.map((m) => {
                const edited = edits[m.userId];
                const value = edited ?? String(m.splitPct);
                const dirty = edited !== undefined && Number(edited) !== m.splitPct;
                return (
                  <tr key={m.userId}>
                    <td className="px-4 py-2.5">
                      <span className="block text-foreground">{m.name ?? m.email ?? 'Agent'}</span>
                      <span className="block text-xs text-muted-foreground">
                        {m.role.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
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
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{m.deals}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {formatCurrency(m.commissionTotal)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground">
                      {formatCurrency(m.shareTotal)}
                    </td>
                  </tr>
                );
              })}
              {team.unassigned.deals > 0 && (
                <tr className="bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground" colSpan={2}>
                    Unassigned
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {team.unassigned.deals}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {formatCurrency(team.unassigned.commissionTotal)}
                  </td>
                  <td className="px-4 py-2.5" />
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
