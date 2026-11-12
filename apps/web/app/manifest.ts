import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Sureground',
    description: 'Property services for renters, landlords, owners, buyers, realtors and agents.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#20232b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
