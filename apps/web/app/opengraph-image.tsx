import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

export const alt = `${SITE_NAME} — Trust-Driven Property Operating System`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default OpenGraph / social card image, generated at build time.
 * Reflects the platform's primary brand colour and clean, Apple-inspired
 * visual language used across the app.
 */
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
            background: '#0071e3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          G
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#1d1d1f' }}>{SITE_NAME}</div>
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
          <span>The trust-driven</span>
          <span>property operating system.</span>
        </div>
        <div
          style={{
            fontSize: 26,
            color: '#6e6e73',
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
          color: '#0071e3',
        }}
      >
        <span>VERIFIED IDENTITIES</span>
        <span>·</span>
        <span>VERIFIED PROPERTIES</span>
        <span>·</span>
        <span>ESCROW-SECURED PAYMENTS</span>
      </div>
    </div>,
    size
  );
}
