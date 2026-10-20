'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '@getrentos/ui';

interface Verification {
  id: string;
  label: string;
  verified: boolean;
  description: string;
}

const FACTOR_WEIGHTS: Record<string, number> = {
  identity: 15,
  phone: 10,
  email: 8,
  background_check: 15,
  references: 5,
};

interface ScoreFactorsProps {
  verifications: Verification[];
}

export const ScoreFactors = ({ verifications }: ScoreFactorsProps) => {
  const factors = verifications.map((v) => ({
    label: v.label,
    impact: FACTOR_WEIGHTS[v.id] != null ? `+${FACTOR_WEIGHTS[v.id]}` : '+0',
    status: v.verified ? 'positive' : 'pending',
    description: v.description,
  }));

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Score Factors</h3>
        <p className="text-xs text-muted-foreground mt-0.5">What impacts your trust score</p>
      </div>

      <div className="divide-y divide-border">
        {factors.map((factor, index) => (
          <div key={index} className="p-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {factor.status === 'positive' && <CheckCircle className="w-4 h-4 text-success" />}
              {factor.status === 'pending' && <AlertCircle className="w-4 h-4 text-warning" />}
              {factor.status === 'negative' && <XCircle className="w-4 h-4 text-destructive" />}
              <div>
                <span className="text-sm text-foreground">{factor.label}</span>
                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                factor.status === 'positive'
                  ? 'text-success'
                  : factor.status === 'pending'
                    ? 'text-warning'
                    : 'text-destructive'
              }`}
            >
              {factor.impact}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
