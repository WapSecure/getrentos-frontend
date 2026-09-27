import type { SVGProps } from 'react';

/** Generated from getrentos-logo-primary.svg — GetRentos brand artifact. */
export function GetRentosLogoPrimary(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 720 150" {...props}>
      <defs>
        <linearGradient id="gr_GetRentosLogoPrimary_b" x1="16" y1="14" x2="108" y2="126">
          <stop stopColor="#35B8FF" />
          <stop offset=".55" stopColor="#1478F2" />
          <stop offset="1" stopColor="#0E5BEF" />
        </linearGradient>
      </defs>
      <g
        transform="translate(4 3) scale(.95)"
        fill="none"
        stroke="url(#gr_GetRentosLogoPrimary_b)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 122 64 24l46 98" strokeWidth="24" />
        <path d="M64 122V96" strokeWidth="16" />
      </g>
      <text
        x="142"
        y="91"
        fontFamily="Inter,Arial,sans-serif"
        fontSize="68"
        fontWeight="750"
        letterSpacing="-3"
      >
        <tspan fill="#0B1220">Get</tspan>
        <tspan fill="#1478F2">Rentos</tspan>
      </text>
      <text
        x="146"
        y="121"
        fontFamily="Inter,Arial,sans-serif"
        fontSize="13"
        fontWeight="600"
        letterSpacing="5.4"
        fill="#667085"
      >
        HOMES. PEOPLE. OPPORTUNITIES.
      </text>
    </svg>
  );
}
