'use client';

import { useQuery } from '@tanstack/react-query';
import { TrustScoreHeader } from '@/components/renter/trust-score/TrustScoreHeader';
import { TrustScoreStats } from '@/components/renter/trust-score/TrustScoreStats';
import { TrustScoreRing } from '@/components/shared/trust/TrustScoreRing';
import { VerificationList } from '@/components/renter/trust-score/VerificationList';
import { TrustScoreHistory } from '@/components/renter/trust-score/TrustScoreHistory';
import { ImprovementSuggestions } from '@/components/renter/trust-score/ImprovementSuggestions';
import { TrustBadges } from '@/components/shared/trust/TrustBadges';
import { VerificationTimeline } from '@/components/renter/trust-score/VerificationTimeline';
import { TrustScoreBenefits } from '@/components/renter/trust-score/TrustScoreBenefits';
import { TrustScoreComparison } from '@/components/renter/trust-score/TrustScoreComparison';
import { ScoreFactors } from '@/components/renter/trust-score/ScoreFactors';
import { TrustScoreTips } from '@/components/renter/trust-score/TrustScoreTips';
import { ScoreForecast } from '@/components/renter/trust-score/ScoreForecast';
import { ScoreNotifications } from '@/components/renter/trust-score/ScoreNotifications';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { PageErrorState, PageLoadingState } from '@getrentos/ui';

export default function TrustScorePage() {
  const trustScoreQuery = useQuery({
    queryKey: renterKeys.trustScore,
    queryFn: () => unwrap(renterService.getTrustScore()),
  });
  const data = trustScoreQuery.data;
  const trustScore = data?.trustScore ?? 0;
  const averageScore = data?.averageScore ?? 0;
  const verifications = data?.verifications ?? [];
  const history = data?.history ?? [];
  const badges = data?.badges ?? [];

  if (trustScoreQuery.isLoading) return <PageLoadingState />;
  if (trustScoreQuery.isError) {
    return (
      <PageErrorState
        title="Trust score is unavailable"
        description="We could not load your score, verification history, or recommendations."
        onRetry={() => void trustScoreQuery.refetch()}
        isRetrying={trustScoreQuery.isFetching}
      />
    );
  }

  return (
    <>
      <TrustScoreHeader trustScore={trustScore} />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <TrustScoreRing score={trustScore} size={200} strokeWidth={12} />
        </div>
        <div className="lg:col-span-2">
          <TrustScoreStats trustScore={trustScore} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VerificationList verifications={verifications} />
          <TrustScoreHistory history={history} />
          <VerificationTimeline verifications={verifications} />
          <ScoreFactors verifications={verifications} />
        </div>
        <div className="space-y-6">
          <TrustBadges badges={badges} />
          <ScoreForecast currentScore={trustScore} verifications={verifications} />
          <ImprovementSuggestions verifications={verifications} />
          <TrustScoreTips />
          <TrustScoreComparison currentScore={trustScore} averageScore={averageScore} />
          <TrustScoreBenefits />
          <ScoreNotifications history={history} />
        </div>
      </div>
    </>
  );
}
