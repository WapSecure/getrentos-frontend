export interface TrustBand {
  label: string;
  color: string;
}

// Mirrors the backend trust STAGE ladder (score.dimensions.ts) so every screen names a score the same way.
export function trustBand(score: number): TrustBand {
  if (score >= 85) return { label: 'Highly trusted', color: 'text-success' };
  if (score >= 70) return { label: 'Trusted', color: 'text-success' };
  if (score >= 50) return { label: 'Established', color: 'text-foreground' };
  if (score >= 25) return { label: 'Building', color: 'text-warning' };
  return { label: 'New', color: 'text-muted-foreground' };
}
