'use client';

import { Sparkles, User, Phone, Mail, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface Verification {
  id: string;
  label: string;
  verified: boolean;
  description: string;
}

// Deterministic factor weights (same weights as ScoreFactors).
const FACTOR_WEIGHTS: Record<string, number> = {
  identity: 15,
  phone: 10,
  email: 8,
  background_check: 15,
  references: 5,
};

const FACTOR_ICONS: Record<string, React.ElementType> = {
  identity: User,
  phone: Phone,
  email: Mail,
  background_check: Shield,
  references: Users,
};

interface ImprovementSuggestionsProps {
  verifications: Verification[];
}

export const ImprovementSuggestions = ({ verifications }: ImprovementSuggestionsProps) => {
  const suggestions = verifications
    .filter((v) => !v.verified)
    .map((v) => ({
      id: v.id,
      icon: FACTOR_ICONS[v.id] ?? CheckCircle,
      title: `Complete ${v.label}`,
      description:
        FACTOR_WEIGHTS[v.id] != null
          ? `${v.description} for +${FACTOR_WEIGHTS[v.id]} points`
          : v.description,
      priority: FACTOR_WEIGHTS[v.id] != null && FACTOR_WEIGHTS[v.id] >= 15 ? 'high' : 'medium',
    }));

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Improve Your Score</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Complete these actions to increase your trust score
        </p>
      </div>

      {suggestions.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className="text-sm">You&apos;re all set! All verifications are complete.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div key={suggestion.id} className="p-4 hover:bg-secondary transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      suggestion.priority === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        suggestion.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          suggestion.priority === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-0">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
