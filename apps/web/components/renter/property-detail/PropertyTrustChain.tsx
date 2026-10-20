'use client';

import { Check, FileCheck, Home, ShieldCheck, UserCheck, type LucideIcon } from 'lucide-react';
import { trustChainLabel } from '@getrentos/shared';
import type { Property, PropertyTrustStepId } from '@/types/renter';

/**
 * The property trust chain, rendered for renters on the property detail page:
 * verified owner → ownership confirmed → property verified → payment protected.
 * It is the consumer-facing proof of the GetRentos moat — why a listing here is
 * safer than one on an open marketplace. Renders nothing when the payload
 * carries no chain (older listings, or the browse list where it is omitted).
 */

const STEP_ICON: Record<PropertyTrustStepId, LucideIcon> = {
  owner: UserCheck,
  authority: FileCheck,
  property: Home,
  payment: ShieldCheck,
};

export const PropertyTrustChain = ({ property }: { property: Property }) => {
  const chain = property.trustChain;
  if (!chain || chain.steps.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ShieldCheck className="w-4 h-4 text-success" aria-hidden />
          Trust &amp; safety
        </h3>
        <span className="text-xs text-muted-foreground">{trustChainLabel(chain).label}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        How GetRentos has checked this home and protects your money.
      </p>

      <ol className="relative space-y-3">
        {chain.steps.map((step, index) => {
          const Icon = STEP_ICON[step.id] ?? Check;
          const isLast = index === chain.steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-3">
              {/* Connector line between the chain links */}
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-[15px] top-8 bottom-[-12px] w-px ${
                    step.met ? 'bg-success/40' : 'bg-border'
                  }`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  step.met ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-sm font-medium ${
                      step.met ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.met && (
                    <Check className="h-3.5 w-3.5 text-success shrink-0" aria-label="verified" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
