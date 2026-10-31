'use client';

import {
  Shield,
  Building2,
  Award,
  Clock,
  HelpCircle,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge, Button, Card } from '@getrentos/ui';
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
  delay,
}: VerificationRequestCardProps) => {
  const type = typeConfig[request.type];
  const TypeIcon = type.icon;
  const isPending = request.status === 'pending_review';

  return (
    <Card hover delay={delay} className="p-4">
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
        {request.status === 'approved' && (
          <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
            Approved
          </Badge>
        )}
        {request.status === 'rejected' && (
          <Badge variant="danger" icon={<XCircle className="h-3 w-3" />}>
            Rejected
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {request.documentCount} document{request.documentCount === 1 ? '' : 's'}
        </span>
        <span>Submitted {formatDate(request.submittedAt)}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        {isPending ? (
          <Button variant="primary" size="sm" fullWidth onClick={onReview}>
            Review
          </Button>
        ) : (
          <Button variant="outline" size="sm" fullWidth onClick={onReview}>
            {request.status === 'needs_clarification' ? 'Review' : 'View documents'}
          </Button>
        )}
      </div>
    </Card>
  );
};
