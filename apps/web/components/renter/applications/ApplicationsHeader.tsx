'use client';

import { FileText, Download, Plus } from 'lucide-react';
import { Button } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface ApplicationsHeaderProps {
  onExport: () => void;
}

export const ApplicationsHeader = ({ onExport }: ApplicationsHeaderProps) => {
  return (
    <div>
      <RenterPageHeader
        eyebrow=""
        icon={FileText}
        title="My applications"
        description="Track every application, review its progress, and keep your next steps organised."
        actions={
          <>
            <Button
              variant="outline"
              onClick={onExport}
              size="sm"
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Export
            </Button>
            <Button
              href={ROUTES.RENTER_DISCOVER}
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              New application
            </Button>
          </>
        }
      />
    </div>
  );
};
