'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Phone,
  Mail,
  User,
  FileText,
  CreditCard,
  Users,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { TrustScoreRing } from '@/components/renter/shared/TrustScoreRing';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { ROUTES } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';
import { trustBand } from '@/lib/trustScore';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface VerificationItem {
  label: string;
  verified: boolean;
  icon: React.ElementType;
}

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Phone,
  Mail,
  User,
  FileText,
  CreditCard,
  Users,
};

export const RenterTrustScoreCard = () => {
  const { t } = useLanguage();
  const { data } = useQuery({
    queryKey: renterKeys.trustScore,
    queryFn: () => unwrap(renterService.getTrustScore()),
  });
  const trustScore = data?.trustScore ?? 0;
  const verificationItems: VerificationItem[] = (data?.verifications ?? []).map((v) => ({
    label: v.label,
    verified: v.verified,
    icon: iconMap[v.icon] || Shield,
  }));

  const verifiedCount = verificationItems.filter((item) => item.verified).length;
  const totalCount = verificationItems.length || 1;
  const progress = Math.round((verifiedCount / totalCount) * 100);
  const pendingItems = verificationItems.filter((item) => !item.verified).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Profile strength
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            {t('dashboard.trust_score.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dashboard.trust_score.subtitle')}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Shield className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex items-center gap-5 rounded-2xl border border-border/70 bg-secondary/40 p-4">
          <TrustScoreRing score={trustScore} size={104} strokeWidth={8} />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {trustBand(trustScore).label} Trust Score
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Complete your profile to make applications easier to review.
            </p>
            <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {progress}% verified
            </span>
          </div>
        </div>

        {pendingItems.length > 0 ? (
          <div className="mb-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Recommended next steps
            </p>
            <div className="space-y-2">
              {pendingItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-border/70 px-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-secondary p-1.5">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
            <CheckCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            Your verification profile is complete.
          </div>
        )}

        <div className="mb-5">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Verification Progress</span>
            <span>
              {verifiedCount}/{totalCount} completed
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(verifiedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        <Button href={ROUTES.RENTER_TRUST_SCORE} variant="outline" fullWidth className="gap-2">
          <TrendingUp className="w-4 h-4" />
          {t('dashboard.trust_score.improve_button')}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
};
