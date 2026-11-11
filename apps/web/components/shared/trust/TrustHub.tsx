'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Star } from '@sureground/icons';
import { PageHeader } from '@sureground/ui';
import { getStoredUser } from '@/lib/authStorage';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';
import { TrustOverviewView } from '@/components/shared/trust/TrustOverviewView';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import type { TrustPurpose } from '@/services/trustService';
import type { TrustPortal, TrustRequirementKey } from '@/types/trust-score';

type HubPortal = Exclude<TrustPortal, 'manager'>;

export interface TrustHubExtraTab extends HubTab {
  description: string;
  content: ReactNode;
}

interface TrustHubProps {
  portal: HubPortal;
  purpose: TrustPurpose;
  /** What verifying unlocks in this role. */
  verificationDescription: string;
  /** This page's path, linked from the verification tab back to the score. */
  trustHref: string;
  /** Shown under the score: history for renters, the public profile for others. */
  moreDetails?: ReactNode;
  extraTabs?: TrustHubExtraTab[];
  subjectId?: string;
}

const TRUST_TAB: HubTab = { id: 'trust', label: 'Trust score', icon: Star };
const VERIFICATION_TAB: HubTab = { id: 'verification', label: 'Verification', icon: ShieldCheck };

// Requirements fixed outside the verification flow open the page that owns them.
function hrefFor(portal: HubPortal, key: TrustRequirementKey): string | null {
  switch (key) {
    case 'EMAIL':
      if (portal === 'estate') return null;
      return `/${portal}/settings?tab=${portal === 'renter' ? 'account' : 'profile'}`;
    case 'PROFESSIONAL_LICENCE':
      return `/${portal}/settings?tab=verification`;
    case 'PROPERTY_OWNERSHIP':
      return `/${portal}/properties`;
    default:
      return null;
  }
}

/** One trust page for every role: score, verification and any role extras as tabs. */
export function TrustHub({
  portal,
  purpose,
  verificationDescription,
  trustHref,
  moreDetails,
  extraTabs = [],
  subjectId,
}: TrustHubProps) {
  const router = useRouter();
  const tabs = [TRUST_TAB, VERIFICATION_TAB, ...extraTabs];
  const [activeTab, setTab] = useHubTab(
    TRUST_TAB.id,
    tabs.map((t) => t.id)
  );
  const userId = subjectId || getStoredUser<{ id?: string }>()?.id || '';
  const extra = extraTabs.find((t) => t.id === activeTab);

  const description =
    activeTab === VERIFICATION_TAB.id
      ? verificationDescription
      : (extra?.description ?? 'Your identity, what you need here, and your trust score.');

  const onAction = (key: TrustRequirementKey) => {
    const href = hrefFor(portal, key);
    if (href) router.push(href);
    else setTab(VERIFICATION_TAB.id);
  };

  return (
    <>
      <PageHeader title="Trust & verification" description={description} />
      <HubTabs
        tabs={tabs.map(({ id, label, icon }) => ({ id, label, icon }))}
        activeTab={activeTab}
        onChange={setTab}
      />
      {activeTab === TRUST_TAB.id && (
        <TrustOverviewView portal={portal} onAction={onAction} moreDetails={moreDetails} />
      )}
      {activeTab === VERIFICATION_TAB.id && (
        <VerificationCenter subjectId={userId} purpose={purpose} trustScoreHref={trustHref} />
      )}
      {extra?.content}
    </>
  );
}
