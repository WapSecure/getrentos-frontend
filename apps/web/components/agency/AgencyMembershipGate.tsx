'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase } from '@sureground/icons';
import { Button, CardSkeleton, EmptyState, ThemeToggle } from '@sureground/ui';
import { Logo } from '@/components/ui/Logo';
import { AccountMenu } from '@/components/shared/navigation/AccountMenu';
import { ROLES, getDashboardRoute, resolvePrimaryRoleId } from '@/lib/constants/auth';
import { agencyTeamService } from '@/services/agencyTeamService';
import { ManagerAssistant } from './assistant/ManagerAssistant';
import { useCustody } from './CustodyProvider';

export type AgencyMembership = 'loading' | 'member' | 'not-member' | 'unknown';

// Someone named directly on an engagement (without a firm) counts as inside; anything but a clear refusal is "unknown".
export function useAgencyMembership(enabled = true): AgencyMembership {
  const custody = useCustody();
  const team = useQuery({
    queryKey: ['agency', 'membership'],
    enabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await agencyTeamService.members();
      if (res.success) return true;
      if (res.status === 403) return false;
      throw new Error(res.error || 'Could not check your firm.');
    },
  });

  if (!enabled) return 'unknown';
  if (team.data === true) return 'member';
  if (team.isLoading || custody.loading) return 'loading';
  if (team.data === false) {
    return custody.mandates.length > 0 ? 'member' : 'not-member';
  }
  return 'unknown';
}

export function AgencyNotMemberState({ roles }: { roles?: string[] }) {
  const home = getDashboardRoute(resolvePrimaryRoleId(roles));
  return (
    <div className="mx-auto max-w-2xl p-6">
      <EmptyState
        icon={Briefcase}
        title="You are not a member of a managing agency"
        description="The agency workspace is for the staff of a property management firm. Start your own firm, or ask a firm to invite you to its team and open the link in the invitation email."
        action={<Button href="/agency/setup">Start a firm</Button>}
        secondaryAction={
          <Button href={home} variant="outline">
            Back to your dashboard
          </Button>
        }
      />
    </div>
  );
}

export function AgencyLoadingState() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto max-w-3xl space-y-6 p-6">
      <CardSkeleton lines={2} />
      <CardSkeleton lines={5} />
    </div>
  );
}

export function AgencyPlainHeader({
  user,
  showAssistant = false,
}: {
  user: { fullName: string; email: string; roles?: string[] } | null;
  showAssistant?: boolean;
}) {
  const roleId = resolvePrimaryRoleId(user?.roles);
  const roleLabel = Object.values(ROLES).find((role) => role.id === roleId)?.name ?? 'Account';
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {showAssistant && <ManagerAssistant />}
          <AccountMenu user={user} roleId={roleId} roleLabel={roleLabel} />
        </div>
      </div>
    </nav>
  );
}

export function usesOwnerWorkspace(roles?: string[]): boolean {
  return Boolean(
    roles?.some(
      (role) => role === 'PROPERTY_MANAGER' || role === 'LANDLORD' || role === 'PROPERTY_OWNER'
    )
  );
}
