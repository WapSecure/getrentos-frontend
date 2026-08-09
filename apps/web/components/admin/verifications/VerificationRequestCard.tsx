'use client';

import { motion } from 'framer-motion';
import { Shield, Building2, Award, Clock, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import type { VerificationRequest, VerificationRequestType } from '@/types/admin';

const typeConfig: Record<VerificationRequestType, { icon: React.ElementType; label: string }> = {
  identity: { icon: Shield, label: 'Identity' },
  property: { icon: Building2, label: 'Property' },
  license: { icon: Award, label: 'License' },
};

interface VerificationRequestCardProps {
  request: VerificationRequest;
  onReview: () => void;
  delay?: number;
}

export const VerificationRequestCard = ({
  request,
  onReview,
  delay = 0,
}: VerificationRequestCardProps) => {
  const type = typeConfig[request.type];
  const TypeIcon = type.icon;
  const isPending = request.status === 'pending_review';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <TypeIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{request.applicantName}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {type.label} · {request.subjectLabel}
            </p>
          </div>
        </div>
        {isPending && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )}
        {request.status === 'needs_clarification' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20">
            <HelpCircle className="w-3 h-3" />
            Needs Info
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {request.documentCount} document{request.documentCount === 1 ? '' : 's'}
        </span>
        <span>Submitted {formatDate(request.submittedAt)}</span>
      </div>

      {isPending && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="primary" size="sm" fullWidth onClick={onReview}>
            Review
          </Button>
        </div>
      )}
    </motion.div>
  );
};
