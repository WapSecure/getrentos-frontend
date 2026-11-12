import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

export const alt = `${SITE_NAME}: Rent, buy and manage property`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#ffffff',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: '#20232b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 128 128">
            <g
              fill="none"
              stroke="#ffffff"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M28 82 64 22l36 60" />
              <path d="M12 108h104" />
            </g>
          </svg>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#1d1d1f', letterSpacing: -0.75 }}>
          {SITE_NAME}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 72,
            fontWeight: 800,
            color: '#1d1d1f',
            lineHeight: 1.05,
          }}
        >
          <span>Rent, buy and manage property</span>
          <span>with fewer surprises.</span>
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#4f4f55',
            maxWidth: 860,
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 18,
          fontWeight: 700,
          color: '#20232b',
        }}
      >
        <span>VERIFIED IDENTITIES</span>
        <span>·</span>
        <span>VERIFIED PROPERTIES</span>
        <span>·</span>
        <span>PROTECTED PAYMENTS</span>
      </div>
    </div>,
    size
  );
}
