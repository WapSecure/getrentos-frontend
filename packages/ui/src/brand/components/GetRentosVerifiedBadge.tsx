import type { SVGProps } from 'react';

/** Generated from getrentos-verified-badge.svg — GetRentos brand artifact. */
export function GetRentosVerifiedBadge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 320 72" {...props}>
      <rect
        x="1"
        y="1"
        width="318"
        height="70"
        rx="20"
        fill="#F5F9FF"
        stroke="#D8E8FF"
        strokeWidth="2"
      />
      <path d="M24 19 42 13 60 19V34C60 46 52 55 42 60 32 55 24 46 24 34Z" fill="#1478F2" />
      <path
        d="M34 35 40 41 51 28"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="76"
        y="34"
        fontFamily="Inter,Arial,sans-serif"
        fontSize="18"
        fontWeight="750"
        fill="#0B1220"
      >
        GetRentos Verified
      </text>
      <text
        x="76"
        y="53"
        fontFamily="Inter,Arial,sans-serif"
        fontSize="11"
        fontWeight="500"
        fill="#667085"
      >
        IDENTITY • PROPERTY • AUTHORITY
      </text>
    </svg>
  );
}
