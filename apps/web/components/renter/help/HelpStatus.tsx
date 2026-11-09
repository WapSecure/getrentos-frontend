'use client';

import { Activity } from 'lucide-react';
import { Alert } from '@sureground/ui';

export const HelpStatus = () => {
  return (
    <Alert variant="success" icon={Activity} className="mb-6">
      <span className="font-medium">Sureground services are operational</span>
    </Alert>
  );
};
