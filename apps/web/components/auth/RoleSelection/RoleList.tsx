'use client';

import { forwardRef, useId, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Check,
  Home,
  Search,
  TrendingUp,
  UserCheck,
  Users,
} from '@sureground/icons';
import { Card, Field, RadioGroup } from '@sureground/ui';
import {
  ONE_ID_CHECK,
  REALTOR_VS_AGENT,
  ROLES,
  SIGNUP_ROLE_GROUPS,
  cn,
  needsSharedIdNote,
  signupRequirementLines,
} from '@sureground/shared';

type Role = (typeof ROLES)[keyof typeof ROLES];

const ICONS = { Home, Building2, TrendingUp, Search, Users, UserCheck, Briefcase };

const roleById = (id: string): Role | undefined =>
  Object.values(ROLES).find((role) => role.id === id);

export const roleName = (id: string) => roleById(id)?.name ?? id;

function RoleIcon({ role, className }: { role: Role; className?: string }) {
  const Icon = ICONS[role.icon as keyof typeof ICONS] ?? Home;
  return <Icon className={className} aria-hidden="true" />;
}

function RoleRow({
  role,
  selected,
  onToggle,
}: {
  role: Role;
  selected: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-labelledby={`${id}-name`}
      aria-describedby={`${id}-description`}
      data-role-row=""
      onClick={onToggle}
      className={cn(
        'relative flex min-h-16 w-full items-center gap-3.5 px-4 py-3 text-left transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
        'before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary before:transition-opacity before:duration-200 motion-reduce:before:transition-none',
        selected
          ? 'bg-primary/[0.035] before:opacity-100 hover:bg-primary/[0.06] active:bg-primary/[0.08]'
          : 'bg-card before:opacity-0 hover:bg-secondary/40 active:bg-secondary/70'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 motion-reduce:transition-none',
          selected ? 'bg-primary/10 ring-1 ring-inset ring-primary/15' : 'bg-secondary/70'
        )}
      >
        <RoleIcon
          role={role}
          className={cn('h-[18px] w-[18px]', selected ? 'text-primary' : 'text-muted-foreground')}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span id={`${id}-name`} className="block font-medium text-foreground">
          {role.name}
        </span>
        <span id={`${id}-description`} className="block text-sm text-muted-foreground sm:truncate">
          {role.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150 motion-reduce:transition-none',
          selected
            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
            : 'border-border/80 bg-card'
        )}
      >
        <motion.span
          initial={false}
          animate={{ scale: selected ? 1 : 0.5, opacity: selected ? 1 : 0 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          className="flex"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </span>
    </button>
  );
}

interface RoleListProps {
  selected: readonly string[];
  onToggle: (roleId: string) => void;
}

export const RoleList = forwardRef<HTMLDivElement, RoleListProps>(function RoleList(
  { selected, onToggle },
  ref
) {
  const baseId = useId();

  // Arrow keys walk every row in order, across group boundaries.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const rows = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-role-row]')
    );
    const current = rows.indexOf(event.target as HTMLButtonElement);
    if (current === -1) return;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? rows.length - 1
          : Math.min(rows.length - 1, Math.max(0, current + (event.key === 'ArrowDown' ? 1 : -1)));
    event.preventDefault();
    rows[next]?.focus();
  };

  return (
    <div ref={ref} onKeyDown={onKeyDown} className="space-y-6">
      {SIGNUP_ROLE_GROUPS.map((group) => {
        const headingId = `${baseId}-${group.id}`;
        return (
          <section key={group.id} role="group" aria-labelledby={headingId}>
            <h2 id={headingId} className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
              {group.title}
            </h2>
            <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
              {group.roles.map((id) => {
                const role = roleById(id);
                if (!role) return null;
                return (
                  <RoleRow
                    key={id}
                    role={role}
                    selected={selected.includes(id)}
                    onToggle={() => onToggle(id)}
                  />
                );
              })}
            </div>
            {group.id === 'work' && (
              <p className="mt-2 px-1 text-xs text-muted-foreground">{REALTOR_VS_AGENT}</p>
            )}
          </section>
        );
      })}
    </div>
  );
});

interface RoleSummaryProps {
  selected: readonly string[];
  onPrimaryChange: (roleId: string) => void;
  className?: string;
}

export function RoleSummary({ selected, onPrimaryChange, className }: RoleSummaryProps) {
  const headingId = useId();
  const lines = signupRequirementLines(selected);

  return (
    <Card static className={cn('border-border/70 p-5 shadow-sm', className)}>
      <section aria-labelledby={headingId} className="space-y-4">
        <h2 id={headingId} className="text-base font-semibold text-foreground">
          Your picks
        </h2>

        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pick everything that fits. You can add more later.
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {selected.map((id) => {
                const role = roleById(id);
                if (!role) return null;
                return (
                  <li key={id} className="flex items-center gap-2 text-sm text-foreground">
                    <RoleIcon role={role} className="h-4 w-4 text-muted-foreground" />
                    {role.name}
                  </li>
                );
              })}
            </ul>

            {selected.length > 1 && (
              <Field label="Which do you want to start with?">
                <RadioGroup
                  value={selected[0]}
                  onValueChange={onPrimaryChange}
                  options={selected.map((id) => ({ value: id, label: roleName(id) }))}
                />
              </Field>
            )}

            {lines.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="text-sm font-medium text-foreground">Checks we ask for later</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {lines.map((line) => (
                    <li key={line.groupId}>{line.text}.</li>
                  ))}
                </ul>
                {needsSharedIdNote(lines) && (
                  <p className="text-xs text-muted-foreground">{ONE_ID_CHECK}</p>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </Card>
  );
}
