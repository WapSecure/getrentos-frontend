'use client';

import { Users, UserPlus, FileText } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface RoommatesHeaderProps {
  roommateCount: number;
  onInvite: () => void;
  onAgreement: () => void;
}

export const RoommatesHeader = ({ roommateCount, onInvite, onAgreement }: RoommatesHeaderProps) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roommates</h1>
          <p className="text-muted-foreground mt-1">Manage your shared living arrangements</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" size="sm" onClick={onAgreement}>
            <FileText className="w-4 h-4" />
            Roommate Agreement
          </Button>
          <Button variant="primary" className="gap-2" size="sm" onClick={onInvite}>
            <UserPlus className="w-4 h-4" />
            Invite Roommate
          </Button>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {roommateCount} people in your household
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Manage roommates, split expenses, and share responsibilities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
