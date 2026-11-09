import { forwardRef } from 'react';
import type { LucideProps } from 'lucide-react';

// Lucide ships no naira glyph, so this matches its icon props and works wherever a LucideIcon does.
export const NairaSign = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, color = 'currentColor', strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M7 4l10 16" />
      <path d="M4 9.5h16" />
      <path d="M4 14.5h16" />
    </svg>
  )
);
NairaSign.displayName = 'NairaSign';
