'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@sureground/ui';

interface DashboardHeaderProps {
  /** "Good morning, Ada": the page's h1. */
  title: string;
  /** One line on what this dashboard is for. */
  description: ReactNode;
  /** The one primary action, in Sureground blue. */
  action?: ReactNode;
}

const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

/** Every role's dashboard opens the same way: today's date, a greeting, one line of context, one action. */
export function DashboardHeader({ title, description, action }: DashboardHeaderProps) {
  return (
    <PageHeader eyebrow={todayLabel()} title={title} description={description} actions={action} />
  );
}
