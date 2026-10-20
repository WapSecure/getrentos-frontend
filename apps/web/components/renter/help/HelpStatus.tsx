'use client';

import { Activity } from 'lucide-react';
import { Alert } from '@getrentos/ui';

export const HelpStatus = () => {
  return (
    <Alert variant="success" icon={Activity} className="mb-6">
      <span className="font-medium">GetRentos services are operational</span>
    </Alert>
  );
};
