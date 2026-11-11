'use client';

import { useQuery } from '@tanstack/react-query';
import { VerificationList } from '@/components/shared/trust/VerificationList';
import { TrustBadges } from '@/components/shared/trust/TrustBadges';
import { unwrap, type ApiResponse } from '@/lib/apiHelpers';
import type { TrustProfile } from '@/types/trust-score';

interface TrustProfileDetailsProps {
  queryKey: readonly unknown[];
  queryFn: () => Promise<ApiResponse<TrustProfile>>;
  /** Who sees the profile, e.g. "owners and realtors". */
  audience: string;
}

/** The checks and badges other people see on this person's profile. */
export function TrustProfileDetails({ queryKey, queryFn, audience }: TrustProfileDetailsProps) {
  const profile = useQuery({ queryKey, queryFn: () => unwrap(queryFn()) });
  if (!profile.data) return null;

  return (
    <div className="space-y-4">
      <p>
        <span className="font-medium text-foreground">What {audience} see.</span> Your profile shows
        these checks and badges.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <VerificationList verifications={profile.data.verifications ?? []} />
        <TrustBadges badges={profile.data.badges ?? []} />
      </div>
    </div>
  );
}
