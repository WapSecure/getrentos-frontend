'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  Gauge,
  Coins,
  Lock,
  ShieldCheck,
  UserCheck,
  UserRound,
  Users,
  Wrench,
  MessageSquareText,
} from 'lucide-react';
import { Badge, Button, Skeleton } from '@getrentos/ui';
import { useCustody } from './CustodyProvider';
import {
  grantsNothing,
  isLive,
  noticeSummary,
  MANDATE_STATUS_LABELS,
  type ManagementMandateDto,
} from '@/services/mandateService';

/**
 * Who the manager is acting for, always on screen.
 *
 * A manager and an owner look at the same pages. The one thing that must never be
 * ambiguous is whose asset is on the page — every destructive action, every fee
 * and every statement belongs to somebody, and getting it wrong is not a styling
 * mistake. So the answer is not a field on a form, it is a bar that is always
 * there, naming the owner, the property and when the engagement ends.
 *
 * Three states, and the two unhappy ones say so out loud rather than degrading
 * into a blank bar:
 *
 * - **Nothing to manage.** No mandate at all. Says so, and links to how an
 *   engagement starts.
 * - **Nothing selected, but something to select.** Deliberately not defaulted
 *   when there is more than one client, so the first act is choosing.
 * - **Selected.** The owner, the property, the end date, and the scope's limits.
 *
 * It also flags a mandate that grants nothing. A FINANCE-only engagement passes
 * its own checks and then renders an empty portfolio, and an empty portfolio with
 * no explanation reads as a bug or as data loss.
 */
export function CustodyBar() {
  const { mandates, live, selected, select, loading, error } = useCustody();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, so the switcher behaves like a menu
  // rather than a mode.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Working out which clients you manage"
        className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-2"
      >
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="ml-auto h-7 w-32" />
      </div>
    );
  }

  if (error && mandates.length === 0) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 border-b border-warning/25 bg-warning-subtle px-4 py-2 text-sm text-foreground"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        We could not load your clients ({error}). Do not act on a property until this list is back.
        you cannot tell whose it is.
      </div>
    );
  }

  if (mandates.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-sm">
        <span className="font-medium">No client engagements yet.</span>
        <span className="text-muted-foreground">
          A mandate is what lets you act for a property you do not own.
        </span>
        <Link href="/agency/mandates" className="font-medium text-primary hover:underline">
          Manage mandates
        </Link>
        <Link href="/agency/team" className="font-medium text-primary hover:underline">
          Team
        </Link>
        <Link href="/agency/overview" className="font-medium text-primary hover:underline">
          Firm overview
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={wrapper}
      className="relative flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-sm"
    >
      {selected ? (
        <>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <UserRound className="h-4 w-4" aria-hidden />
            Managing for
          </span>
          <span className="font-medium">{selected.ownerName ?? 'the owner'}</span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
            {selected.propertyTitle ?? 'Property'}
          </span>
          <span className="text-muted-foreground" aria-hidden>
            ·
          </span>
          <span className="text-muted-foreground">{noticeSummary(selected)}</span>

          {!isLive(selected) && (
            <Badge variant="warning">{MANDATE_STATUS_LABELS[selected.status]}</Badge>
          )}
          {grantsNothing(selected) && (
            <Badge variant="neutral" icon={<Lock className="h-3 w-3" aria-hidden />}>
              This mandate grants no access yet
            </Badge>
          )}
        </>
      ) : (
        <>
          <span className="flex items-center gap-1.5 font-medium text-warning">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            No client selected
          </span>
          <span className="text-muted-foreground">
            Choose who you are acting for before you change anything.
          </span>
        </>
      )}

      <Button
        href="/agency/home-management"
        variant="outline"
        size="xs"
        rounded="sm" className="ml-auto"
        icon={<Wrench className="h-4 w-4" aria-hidden />}
      >
        Home management
      </Button>

      <Button
        href="/agency/queries"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<MessageSquareText className="h-4 w-4" aria-hidden />}
      >
        Owner questions
      </Button>

      <Button
        href="/agency/commissions"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<Coins className="h-4 w-4" aria-hidden />}
      >
        Commissions
      </Button>

      <Button
        href="/agency/protection"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
      >
        Protection
      </Button>

      <Button
        href="/agency/realtors"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<UserCheck className="h-4 w-4" aria-hidden />}
      >
        Realtor access
      </Button>

      <Button
        href="/agency/team"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<Users className="h-4 w-4" aria-hidden />}
      >
        Team
      </Button>

      <Button
        href="/agency/overview"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<Gauge className="h-4 w-4" aria-hidden />}
      >
        Overview
      </Button>

      <Button
        href="/agency/owners"
        variant="outline"
        size="xs"
        rounded="sm"
        icon={<Users className="h-4 w-4" aria-hidden />}
      >
        All clients
      </Button>

      <Button
        variant="outline"
        size="xs"
        rounded="sm"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-haspopup="listbox"
        iconPosition="right"
        icon={
          <ChevronDown
            className={
              open ? 'h-4 w-4 rotate-180 transition-transform' : 'h-4 w-4 transition-transform'
            }
            aria-hidden
          />
        }
      >
        Switch client
      </Button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-4 top-full z-50 mt-1 max-h-80 w-80 overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          {selected && (
            <li>
              <button
                type="button"
                onClick={() => {
                  select(null);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-muted-foreground hover:bg-accent"
              >
                Clear selection
              </button>
            </li>
          )}
          {mandates.map((mandate) => (
            <MandateOption
              key={mandate.id}
              mandate={mandate}
              chosen={mandate.id === selected?.id}
              onChoose={() => {
                select(mandate.id);
                setOpen(false);
              }}
            />
          ))}
        </ul>
      )}

      {live.length > 0 && live.length !== mandates.length && (
        <span className="text-xs text-muted-foreground">
          {mandates.length - live.length} not live
        </span>
      )}
    </div>
  );
}

function MandateOption({
  mandate,
  chosen,
  onChoose,
}: {
  mandate: ManagementMandateDto;
  chosen: boolean;
  onChoose: () => void;
}) {
  const live = isLive(mandate);
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={chosen}
        onClick={onChoose}
        className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
      >
        <Check
          className={`mt-0.5 h-4 w-4 shrink-0 ${chosen ? 'text-primary' : 'text-transparent'}`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{mandate.propertyTitle ?? 'Property'}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {mandate.ownerName ?? 'the owner'} · {noticeSummary(mandate)}
          </span>
          {!live && (
            <span className="mt-0.5 block text-xs text-warning">
              {MANDATE_STATUS_LABELS[mandate.status]}
              {mandate.status !== 'ACTIVE' && ' — you cannot act under this one yet'}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
