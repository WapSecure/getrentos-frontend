'use client';

import { PasskeySettings } from '@/components/security/PasskeySettings';
import { STAFF_TWO_FACTOR_EXPLAINER, TwoFactorSetup } from '@/components/security/TwoFactorSetup';

export const SecuritySettings = () => (
  <div>
    <h2 className="mb-1 text-xl font-semibold text-foreground">Security</h2>
    <p className="mb-6 text-sm text-muted-foreground">{STAFF_TWO_FACTOR_EXPLAINER}</p>
    <div className="space-y-4">
      <TwoFactorSetup />
      <PasskeySettings />
    </div>
  </div>
);
