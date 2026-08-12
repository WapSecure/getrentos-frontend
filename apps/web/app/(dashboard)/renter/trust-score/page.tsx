'use client';

import { useState, useEffect } from 'react';
import { TrustScoreHeader } from '@/components/renter/trust-score/TrustScoreHeader';
import { TrustScoreStats } from '@/components/renter/trust-score/TrustScoreStats';
import { TrustScoreRing } from '@/components/renter/trust-score/TrustScoreRing';
import { VerificationList } from '@/components/renter/trust-score/VerificationList';
import { TrustScoreHistory } from '@/components/renter/trust-score/TrustScoreHistory';
import { ImprovementSuggestions } from '@/components/renter/trust-score/ImprovementSuggestions';
import { TrustBadges } from '@/components/renter/trust-score/TrustBadges';
import { VerificationTimeline } from '@/components/renter/trust-score/VerificationTimeline';
import { TrustScoreBenefits } from '@/components/renter/trust-score/TrustScoreBenefits';
import { TrustScoreComparison } from '@/components/renter/trust-score/TrustScoreComparison';
import { ScoreFactors } from '@/components/renter/trust-score/ScoreFactors';
import { TrustScoreTips } from '@/components/renter/trust-score/TrustScoreTips';
import { ScoreForecast } from '@/components/renter/trust-score/ScoreForecast';
import { ScoreNotifications } from '@/components/renter/trust-score/ScoreNotifications';
import { VerificationItem, TrustScoreHistoryItem, Badge } from '@/types/trust-score';
import { renterService } from '@/services/renterService';

export default function TrustScorePage() {
  const [trustScore, setTrustScore] = useState(0);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [history, setHistory] = useState<TrustScoreHistoryItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const loadTrustScoreData = async () => {
      const res = await renterService.getTrustScore();
      if (res.success && res.data) {
        setTrustScore(res.data.trustScore);
        setVerifications(res.data.verifications);
        setHistory(res.data.history);
        setBadges(res.data.badges);
      }
    };
    loadTrustScoreData();
  }, []);

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
          <ScoreFactors />
        </div>
        <div className="space-y-6">
          <TrustBadges badges={badges} />
          <ScoreForecast currentScore={trustScore} />
          <ImprovementSuggestions />
          <TrustScoreTips />
          <TrustScoreComparison currentScore={trustScore} />
          <TrustScoreBenefits />
          <ScoreNotifications />
        </div>
      </div>
    </>
  );
}
