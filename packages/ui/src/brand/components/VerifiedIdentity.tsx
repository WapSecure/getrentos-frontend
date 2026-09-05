import type { SVGProps } from 'react';

/** Generated from verified-identity.svg — GetRentos brand artifact. */
export function VerifiedIdentity(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 260 52" role="img" aria-label="Verified Identity" {...props}>
      <rect x="1" y="1" width="258" height="50" rx="25" fill="white" stroke="#E2E8F0" />{' '}
      <circle cx="27" cy="26" r="17" fill="#1478F2" />
      <text
        x="27"
        y="31"
        textAnchor="middle"
        fontFamily="Inter,Arial"
        fontSize="12"
        fontWeight="800"
        fill="white"
      >
        ID
      </text>{' '}
      <text x="55" y="32" fontFamily="Inter,Arial" fontSize="15" fontWeight="700" fill="#0B1220">
        Verified Identity
      </text>
    </svg>
  );
}
