'use client';

import { motion } from 'framer-motion';
import { Shield, Building2, Award, Clock, HelpCircle, FileText } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
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
      className="rounded-2xl border border-border/90 bg-card p-4 shadow-sm transition-shadow duration-300 hover:shadow-md"
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
          <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
            Pending
          </Badge>
        )}
        {request.status === 'needs_clarification' && (
          <Badge variant="warning" icon={<HelpCircle className="h-3 w-3" />}>
            Needs Info
          </Badge>
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
