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

export default function TrustScorePage() {
  const [trustScore, setTrustScore] = useState(0);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [history, setHistory] = useState<TrustScoreHistoryItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  const loadTrustScoreData = () => {
    // Set trust score
    setTrustScore(78);

    // Mock verification items
    const mockVerifications: VerificationItem[] = [
      {
        id: '1',
        label: 'Identity Verification',
        verified: true,
        date: '2024-01-15',
        description: 'Government ID verified',
        icon: 'User',
      },
      {
        id: '2',
        label: 'Email Verification',
        verified: true,
        date: '2024-01-10',
        description: 'Email address confirmed',
        icon: 'Mail',
      },
      {
        id: '3',
        label: 'Phone Verification',
        verified: true,
        date: '2024-01-12',
        description: 'Phone number verified',
        icon: 'Phone',
      },
      {
        id: '4',
        label: 'Property Verification',
        verified: false,
        description: 'Verify your property to increase trust',
        icon: 'FileText',
      },
      {
        id: '5',
        label: 'Background Check',
        verified: false,
        description: 'Complete background check',
        icon: 'Shield',
      },
      {
        id: '6',
        label: 'References Added',
        verified: false,
        description: 'Add references from previous landlords',
        icon: 'Users',
      },
    ];
    setVerifications(mockVerifications);

    // Mock history items
    const mockHistory: TrustScoreHistoryItem[] = [
      { date: '2024-06-01', score: 78, change: 5, reason: 'Email verified' },
      { date: '2024-05-15', score: 73, change: 8, reason: 'Phone verified' },
      { date: '2024-05-01', score: 65, change: 10, reason: 'Identity verified' },
      { date: '2024-04-15', score: 55, change: 0, reason: 'Account created' },
    ];
    setHistory(mockHistory);

    // Mock badges
    const mockBadges: Badge[] = [
      {
        id: '1',
        name: 'Identity Verified',
        icon: 'Shield',
        earned: true,
        description: 'Government ID verified',
      },
      {
        id: '2',
        name: 'Phone Verified',
        icon: 'CheckCircle',
        earned: true,
        description: 'Phone number confirmed',
      },
      {
        id: '3',
        name: 'Email Verified',
        icon: 'Star',
        earned: true,
        description: 'Email address verified',
      },
      {
        id: '4',
        name: 'Property Verified',
        icon: 'Lock',
        earned: false,
        description: 'Property ownership verified',
      },
      {
        id: '5',
        name: 'Trusted Renter',
        icon: 'Crown',
        earned: false,
        description: '5+ successful rentals',
      },
      {
        id: '6',
        name: 'Community Member',
        icon: 'Users',
        earned: false,
        description: 'Active community participation',
      },
    ];
    setBadges(mockBadges);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
