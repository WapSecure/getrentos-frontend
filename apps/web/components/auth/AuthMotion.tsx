'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';

export function AuthMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
