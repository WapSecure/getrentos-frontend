'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@sureground/ui';

interface DashboardHeaderProps {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}

const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export function DashboardHeader({ title, description, action }: DashboardHeaderProps) {
  return (
    <PageHeader eyebrow={todayLabel()} title={title} description={description} actions={action} />
  );
}
