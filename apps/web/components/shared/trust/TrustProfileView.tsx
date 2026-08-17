'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Clock, ShieldCheck, Star } from 'lucide-react';
import { TrustScoreRing } from '@/components/shared/trust/TrustScoreRing';
import { VerificationList } from '@/components/shared/trust/VerificationList';
import { TrustBadges } from '@/components/shared/trust/TrustBadges';
import { unwrap, type ApiResponse } from '@/lib/apiHelpers';
import type { TrustProfile } from '@/types/trust-score';

interface TrustProfileViewProps {
  /** TanStack query key for this role's trust profile. */
  queryKey: readonly unknown[];
  /** Fetches the role trust profile from the backend. */
  queryFn: () => Promise<ApiResponse<TrustProfile>>;
  title: string;
  subtitle: string;
}

/**
 * Renders a role trust & verification profile entirely from real backend data
 * (score, headline stats, verifications and badges) — no fabricated values.
 */
export const TrustProfileView = ({ queryKey, queryFn, title, subtitle }: TrustProfileViewProps) => {
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => unwrap(queryFn()),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Loading trust profile…</div>;
  }

  const trustScore = data?.trustScore ?? 0;
  const stats = data?.stats ?? [];
  const statIcons = [MessageCircle, Clock, ShieldCheck, Star];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-center">
          <TrustScoreRing score={trustScore} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {stats.slice(0, 4).map((stat, index) => {
            const Icon = statIcons[index % statIcons.length];
            return (
              <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
                <div className="inline-flex p-2.5 rounded-xl bg-accent mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <VerificationList verifications={data?.verifications ?? []} />
        <TrustBadges badges={data?.badges ?? []} />
      </div>
    </>
  );
};
