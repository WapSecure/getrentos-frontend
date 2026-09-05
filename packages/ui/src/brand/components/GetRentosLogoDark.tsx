import type { SVGProps } from 'react';

/** Generated from getrentos-logo-dark.svg — GetRentos brand artifact. */
export function GetRentosLogoDark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 720 150" {...props}>
      <defs>
        <linearGradient id="gr_GetRentosLogoDark_b" x1="16" y1="14" x2="108" y2="126">
          <stop stopColor="#35B8FF" />
          <stop offset=".55" stopColor="#1478F2" />
          <stop offset="1" stopColor="#0E5BEF" />
        </linearGradient>
      </defs>
      <rect width="720" height="150" rx="20" fill="#0B1220" />
      <g transform="translate(4 3) scale(.95)">
        <path
          d="M16 44 64 14 112 44 112 70 96 70 96 53 64 33 32 53 32 91 64 110 88 96 88 79 68 79 68 63 104 63 104 105 64 129 16 100Z"
          fill="url(#gr_GetRentosLogoDark_b)"
        />
      </g>
      <text
        x="142"
        y="91"
        fontFamily="Inter,Arial,sans-serif"
        fontSize="68"
        fontWeight="750"
        letterSpacing="-3"
      >
        <tspan fill="white">Get</tspan>
        <tspan fill="#3996FF">Rentos</tspan>
      </text>
      <text
        x="146"
        y="121"
        fontFamily="Inter,Arial,sans-serif"
        fontSize="13"
        fontWeight="600"
        letterSpacing="5.4"
        fill="#B8C2D1"
      >
        HOMES. PEOPLE. OPPORTUNITIES.
      </text>
    </svg>
  );
}
