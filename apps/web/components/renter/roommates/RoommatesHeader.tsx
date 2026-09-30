'use client';

import { Users, UserPlus, FileText } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface RoommatesHeaderProps {
  roommateCount: number;
  onInvite: () => void;
  onAgreement: () => void;
}

export const RoommatesHeader = ({ roommateCount, onInvite, onAgreement }: RoommatesHeaderProps) => {
  return (
    <RenterPageHeader
      eyebrow="Shared living"
      icon={Users}
      title="Roommates"
      description="Coordinate your household, shared expenses, agreements, and responsibilities."
      actions={
        <>
          <Button variant="outline" className="gap-2" size="sm" onClick={onAgreement}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            Roommate agreement
          </Button>
          <Button variant="primary" className="gap-2" size="sm" onClick={onInvite}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Invite roommate
          </Button>
        </>
      }
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {roommateCount} people in your household
            </p>
            <p className="text-xs text-muted-foreground">
              Manage roommates, split expenses, and share responsibilities
            </p>
          </div>
        </div>
      </div>
    </RenterPageHeader>
  );
};
