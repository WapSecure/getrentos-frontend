import type { ReactNode } from 'react';
import { DiasporaGate } from '@/components/diaspora/DiasporaGate';

export default function OwnerInvestLayout({ children }: { children: ReactNode }) {
  return <DiasporaGate portal="owner">{children}</DiasporaGate>;
}
