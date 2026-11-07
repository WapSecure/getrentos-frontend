'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@getrentos/ui';
import { TrustOverviewView } from '@/components/shared/trust/TrustOverviewView';
import { VerificationList } from '@/components/shared/trust/VerificationList';
import { TrustBadges } from '@/components/shared/trust/TrustBadges';
import { unwrap, type ApiResponse } from '@/lib/apiHelpers';
import type { TrustPortal, TrustProfile, TrustRequirementKey } from '@/types/trust-score';

type ProfilePortal = Extract<TrustPortal, 'owner' | 'agent' | 'realtor' | 'buyer'>;

interface TrustProfileViewProps {
  portal: ProfilePortal;
  /** TanStack query key for this role's trust profile. */
  queryKey: readonly unknown[];
  /** Fetches the role trust profile (what others see) from the backend. */
  queryFn: () => Promise<ApiResponse<TrustProfile>>;
  title: string;
  subtitle: string;
  /** Who sees the profile, e.g. "buyers and realtors". */
  audience: string;
}

/** Where each requirement is done, per portal. */
function hrefFor(portal: ProfilePortal, key: TrustRequirementKey): string {
  switch (key) {
    case 'EMAIL':
      return `/${portal}/settings?tab=profile`;
    case 'PROFESSIONAL_LICENCE':
      return `/${portal}/settings?tab=verification`;
    case 'PROPERTY_OWNERSHIP':
      return `/${portal}/properties`;
    default:
      // Phone, NIN, live selfie and the bank check all live on the Verification page.
      return `/${portal}/verification`;
  }
}

/**
 * Trust & Verification for owners, agents, realtors and buyers: the shared
 * overview (identity apart from score, this portal's requirements, one next
 * step), then what others see on the profile, folded away. Every value comes
 * from the backend.
 */
export const TrustProfileView = ({
  portal,
  queryKey,
  queryFn,
  title,
  subtitle,
  audience,
}: TrustProfileViewProps) => {
  const router = useRouter();
  const profile = useQuery({ queryKey, queryFn: () => unwrap(queryFn()) });

  return (
    <>
      <PageHeader title={title} description={subtitle} />
      <TrustOverviewView
        portal={portal}
        onAction={(key) => router.push(hrefFor(portal, key))}
        moreDetails={
          profile.data ? (
            <div className="space-y-4">
              <p>
                <span className="font-medium text-foreground">What {audience} see.</span> Your
                profile shows these checks and badges.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <VerificationList verifications={profile.data.verifications ?? []} />
                <TrustBadges badges={profile.data.badges ?? []} />
              </div>
            </div>
          ) : null
        }
      />
    </>
  );
};
