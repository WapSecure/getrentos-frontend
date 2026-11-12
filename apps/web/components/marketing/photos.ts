import type { StaticImageData } from 'next/image';
import lagosAerial from '@/assets/photos/lagos-aerial.jpg';
import lekkiIkoyiLinkBridge from '@/assets/photos/lekki-ikoyi-link-bridge.jpg';
import lagosApartments from '@/assets/photos/lagos-apartments.jpg';
import lagosResidential from '@/assets/photos/lagos-residential.jpg';
import housePoolTerrace from '@/assets/photos/house-pool-terrace.jpg';
import villaWhitePool from '@/assets/photos/villa-white-pool.jpg';
import houseDarkFacade from '@/assets/photos/house-dark-facade.jpg';
import houseDusk from '@/assets/photos/house-dusk.jpg';
import houseWhiteCubic from '@/assets/photos/house-white-cubic.jpg';
import livingRoomLight from '@/assets/photos/living-room-light.jpg';
import livingRoomWhite from '@/assets/photos/living-room-white.jpg';
import livingRoomEvening from '@/assets/photos/living-room-evening.jpg';
import diningKitchen from '@/assets/photos/dining-kitchen.jpg';

export interface MarketingPhoto {
  src: StaticImageData;
  alt: string;
}

// Stand-in photography (see assets/photos/README.md). Alt text describes only what is shown.
export const photos = {
  lagosAerial: { src: lagosAerial, alt: 'Aerial view of Lagos beside the lagoon' },
  lekkiIkoyiLinkBridge: {
    src: lekkiIkoyiLinkBridge,
    alt: 'The Lekki–Ikoyi Link Bridge in Lagos',
  },
  lagosApartments: { src: lagosApartments, alt: 'Apartment block with balconies in Lagos' },
  lagosResidential: {
    src: lagosResidential,
    alt: 'Residential apartment buildings and trees in Lagos',
  },
  housePoolTerrace: {
    src: housePoolTerrace,
    alt: 'Modern two-storey house with a pool and terrace',
  },
  villaWhitePool: { src: villaWhitePool, alt: 'White modern house with a swimming pool' },
  houseDarkFacade: { src: houseDarkFacade, alt: 'Modern house with a dark facade and balconies' },
  houseDusk: { src: houseDusk, alt: 'Modern house lit up at dusk' },
  houseWhiteCubic: { src: houseWhiteCubic, alt: 'White modern house against a blue sky' },
  livingRoomLight: { src: livingRoomLight, alt: 'Bright living room with a sofa and side table' },
  livingRoomWhite: { src: livingRoomWhite, alt: 'White living room with round mirrors' },
  livingRoomEvening: {
    src: livingRoomEvening,
    alt: 'Living room with tall windows in the evening',
  },
  diningKitchen: { src: diningKitchen, alt: 'Open-plan dining area and kitchen' },
} satisfies Record<string, MarketingPhoto>;
