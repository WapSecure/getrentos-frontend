'use client';

import { Card } from '@getrentos/ui';
import type { LegalResource } from '@/lib/content/legalResources';

interface LegalResourceCardProps {
  resource: LegalResource;
}

export const LegalResourceCard = ({ resource }: LegalResourceCardProps) => {
  return (
    <Card static hover={false} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground">{resource.title}</h3>
        {resource.state && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-accent text-primary font-medium">
            {resource.state}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {resource.body.map((paragraph, index) => (
          <p key={index} className="text-sm text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      <p className="mt-4 pt-3 border-t border-border text-xs text-gray-400">{resource.source}</p>
    </Card>
  );
};
