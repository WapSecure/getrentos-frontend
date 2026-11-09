'use client';

import { PanelLeftClose, PanelLeftOpen } from '@sureground/icons';

export function SidebarRailToggle({
  rail,
  onToggle,
}: {
  rail: boolean;
  onToggle: (next: boolean) => void;
}) {
  const Icon = rail ? PanelLeftOpen : PanelLeftClose;
  const label = rail ? 'Expand sidebar' : 'Collapse sidebar';
  return (
    <button
      type="button"
      className="sidebar-item sidebar-rail-toggle w-full"
      onClick={() => onToggle(!rail)}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sidebar-item-label min-w-0 flex-1 truncate text-left">{label}</span>
    </button>
  );
}
