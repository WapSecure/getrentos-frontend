'use client';

import { Smartphone, WifiOff, ShieldCheck } from 'lucide-react';
import { USSD_CODE } from '@/lib/ussdMenu';

const benefits = [
  {
    icon: WifiOff,
    title: 'Works with zero data',
    description: 'USSD runs over your carrier signal — no internet connection needed, ever.',
  },
  {
    icon: Smartphone,
    title: 'Any phone, not just smartphones',
    description: 'Check your rent, pay, and verify your identity from any feature phone.',
  },
  {
    icon: ShieldCheck,
    title: 'Same secure GetRentos account',
    description: 'USSD sessions are tied to your verified number — no separate signup needed.',
  },
];

export const UssdExplainer = () => {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 bg-accent">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            USSD Access
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">GetRentos without a smartphone</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg">
          Dial <span className="font-semibold text-foreground">{USSD_CODE}</span> from any phone to
          check your rent balance, pay, view your Trust Score, or report a maintenance issue — no
          app, no data plan.
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{benefit.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
