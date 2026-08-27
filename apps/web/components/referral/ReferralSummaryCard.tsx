'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Gift, Users, Wallet, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { referralService } from '@/services/referralService';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ReferralSummary } from '@/types/referral';

export const ReferralSummaryCard = () => {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await referralService.getSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
      setIsLoading(false);
    };
    fetchSummary();
  }, []);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (!summary) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Couldn&apos;t load your referral details. Please try again.
      </div>
    );
  }

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${summary.code}` : '';
  const shareMessage = `Join me on GetRentos! Use my referral code ${summary.code} when you sign up: ${shareUrl}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () =>
        window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank'),
    },
    {
      name: 'SMS',
      icon: MessageCircle,
      color: 'bg-blue-500',
      action: () => window.open(`sms:?body=${encodeURIComponent(shareMessage)}`, '_blank'),
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600',
      action: () =>
        (window.location.href = `mailto:?subject=${encodeURIComponent('Join me on GetRentos')}&body=${encodeURIComponent(shareMessage)}`),
    },
  ];

  return (
    <div className="space-y-6">
      {summary.referredByName && (
        <div className="bg-accent rounded-2xl border border-primary/20 p-4 flex items-center gap-3">
          <Gift className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            You joined via <span className="font-semibold">{summary.referredByName}</span>&apos;s
            referral and earned{' '}
            <span className="font-semibold text-primary">
              {formatCurrency(summary.refereeRewardAmount ?? 0)}
            </span>
            .
          </p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Your referral code</h2>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 min-w-0 p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
            <span className="text-2xl font-bold tracking-widest text-primary">{summary.code}</span>
          </div>
          <Button variant="outline" onClick={handleCopyLink} className="gap-2 shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-full ${option.color} flex items-center justify-center`}
              >
                <option.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">{option.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">People referred</p>
            <p className="text-xl font-bold text-foreground">{summary.totalReferred}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total earned</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(summary.totalEarned)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent referrals</h3>
        {summary.referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No referrals yet — share your code above to start earning.
          </p>
        ) : (
          <div className="space-y-3">
            {summary.referrals.map((referral, index) => (
              <div
                key={`${referral.name}-${index}`}
                className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{referral.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(referral.date)}</p>
                </div>
                <span className="font-semibold text-primary">
                  +{formatCurrency(referral.rewardAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
