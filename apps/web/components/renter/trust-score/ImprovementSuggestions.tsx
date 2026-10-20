'use client';

import {
  BadgeCheck,
  User,
  Phone,
  Mail,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Badge, Card, EmptyState, IconButton } from '@getrentos/ui';

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
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Improve Your Score</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Complete these actions to increase your trust score
        </p>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="You're all set! All verifications are complete."
          size="compact"
          bare
        />
      ) : (
        <div className="divide-y divide-border">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <div key={suggestion.id} className="p-4 hover:bg-secondary transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      suggestion.priority === 'high' ? 'bg-destructive-subtle' : 'bg-warning-subtle'
                    }`}
                  >
                    <Icon
                      aria-hidden="true"
                      className={`w-4 h-4 ${
                        suggestion.priority === 'high' ? 'text-destructive' : 'text-warning'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
                      <Badge
                        variant={suggestion.priority === 'high' ? 'danger' : 'warning'}
                        className="capitalize"
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                  </div>
                  <IconButton size="sm" label={suggestion.title} icon={<ArrowRight />} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
