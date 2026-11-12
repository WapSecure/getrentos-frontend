export interface Area {
  name: string;
  city: string;
}

// Real, commonly searched areas. Used for search suggestions and the crawlable area index.
export const AREAS: Area[] = [
  { name: 'Lekki Phase 1', city: 'Lagos' },
  { name: 'Lekki', city: 'Lagos' },
  { name: 'Ikoyi', city: 'Lagos' },
  { name: 'Victoria Island', city: 'Lagos' },
  { name: 'Banana Island', city: 'Lagos' },
  { name: 'Oniru', city: 'Lagos' },
  { name: 'Ajah', city: 'Lagos' },
  { name: 'Sangotedo', city: 'Lagos' },
  { name: 'Chevron', city: 'Lagos' },
  { name: 'Yaba', city: 'Lagos' },
  { name: 'Surulere', city: 'Lagos' },
  { name: 'Ikeja GRA', city: 'Lagos' },
  { name: 'Ikeja', city: 'Lagos' },
  { name: 'Magodo', city: 'Lagos' },
  { name: 'Gbagada', city: 'Lagos' },
  { name: 'Maryland', city: 'Lagos' },
  { name: 'Maitama', city: 'Abuja' },
  { name: 'Asokoro', city: 'Abuja' },
  { name: 'Wuse 2', city: 'Abuja' },
  { name: 'Jabi', city: 'Abuja' },
  { name: 'Gwarinpa', city: 'Abuja' },
  { name: 'Katampe', city: 'Abuja' },
  { name: 'Guzape', city: 'Abuja' },
  { name: 'Lokogoma', city: 'Abuja' },
  { name: 'GRA Phase 2', city: 'Port Harcourt' },
  { name: 'Trans-Amadi', city: 'Port Harcourt' },
  { name: 'Rumuokoro', city: 'Port Harcourt' },
  { name: 'Bodija', city: 'Ibadan' },
  { name: 'Jericho', city: 'Ibadan' },
  { name: 'Oluyole', city: 'Ibadan' },
];

export const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'] as const;

export function matchAreas(query: string, limit = 6): Area[] {
  const q = query.trim().toLowerCase();
  if (!q) return AREAS.filter((a) => a.city === 'Lagos').slice(0, limit);
  return AREAS.filter(
    (a) => a.name.toLowerCase().includes(q) || a.city.toLowerCase().startsWith(q)
  ).slice(0, limit);
}
