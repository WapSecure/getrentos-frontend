'use client';

import {
  Check,
  Home,
  Building2,
  TrendingUp,
  Search,
  Users,
  UserCheck,
  Shield,
  Briefcase,
} from '@sureground/icons';
import { cn } from '@sureground/shared';
import { ROLES } from '@/lib/constants/auth';

const iconMap = {
  Home: Home,
  Building2: Building2,
  TrendingUp: TrendingUp,
  Search: Search,
  Users: Users,
  UserCheck: UserCheck,
  Shield: Shield,
  Briefcase: Briefcase,
};

// What each role will be asked for later, not something already done.
const REQUIREMENT_LABELS: Record<string, string> = {
  identity: 'Needs ID check',
  property: 'Needs property documents',
  license: 'Needs licence',
};

interface RoleCardProps {
  role: (typeof ROLES)[keyof typeof ROLES];
  isSelected: boolean;
  onToggle: () => void;
}

export const RoleCard = ({ role, isSelected, onToggle }: RoleCardProps) => {
  const Icon = iconMap[role.icon as keyof typeof iconMap];
  const nameId = `role-${role.id}-name`;
  const descriptionId = `role-${role.id}-description`;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-labelledby={nameId}
      aria-describedby={descriptionId}
      onClick={onToggle}
      className={cn(
        'relative h-full w-full rounded-2xl border p-6 text-left transition-[border-color,background-color,box-shadow] duration-150',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
        isSelected
          ? 'border-primary bg-primary/[0.04] shadow-[inset_0_0_0_1px_var(--primary)]'
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
          isSelected ? 'bg-primary/15' : 'bg-secondary'
        )}
      >
        <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-muted-foreground')} />
      </span>

      <span id={nameId} className="mb-1 block pr-8 text-lg font-semibold text-foreground">
        {role.name}
      </span>
      <span id={descriptionId} className="block">
        <span className="block text-sm text-muted-foreground">{role.description}</span>
        {role.requiresVerification.length > 0 && (
          <span className="mt-3 flex flex-wrap gap-1">
            {role.requiresVerification.map((req) => (
              <span
                key={req}
                className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
              >
                {REQUIREMENT_LABELS[req]}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
};
