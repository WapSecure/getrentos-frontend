'use client';

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Score Factors</h3>
        <p className="text-xs text-muted-foreground mt-0.5">What impacts your trust score</p>
      </div>

      <div className="divide-y divide-border">
        {factors.map((factor, index) => (
          <div key={index} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {factor.status === 'positive' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {factor.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
              {factor.status === 'negative' && <XCircle className="w-4 h-4 text-red-500" />}
              <div>
                <span className="text-sm text-foreground">{factor.label}</span>
                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                factor.status === 'positive'
                  ? 'text-green-600'
                  : factor.status === 'pending'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {factor.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
