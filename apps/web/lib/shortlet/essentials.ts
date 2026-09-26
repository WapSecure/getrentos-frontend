/** Amenities hosts can tick; guests filter on the same names. */
export const SHORTLET_AMENITIES = [
  'WiFi',
  'Parking',
  'Swimming Pool',
  'Security',
  '24/7 Power',
  'Gym',
  'Elevator',
  'Air Conditioning',
  'Kitchen',
  'Washer',
];

export const POWER_SOURCE_LABEL: Record<string, string> = {
  GRID: 'Public power (grid)',
  GENERATOR: 'Generator',
  INVERTER: 'Inverter',
  SOLAR: 'Solar',
};

export const WATER_SUPPLY_LABEL: Record<string, string> = {
  BOREHOLE: 'Borehole',
  PUBLIC_MAINS: 'Public mains',
  WATER_TANKER: 'Water tanker',
  TREATED: 'Treated water',
};

export const INTERNET_TYPE_LABEL: Record<string, string> = {
  NONE: 'No internet',
  FIBRE: 'Fibre broadband',
  MOBILE_ROUTER: 'Mobile (4G/5G) router',
  SATELLITE: 'Satellite (e.g. Starlink)',
};

/** "24 hours a day" or "About 16 hours a day". */
export const powerHoursLabel = (hours: number) =>
  hours >= 24
    ? 'Power 24 hours a day'
    : `About ${hours} hour${hours === 1 ? '' : 's'} of power a day`;
