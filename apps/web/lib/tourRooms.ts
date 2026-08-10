import type { TourRoom, VideoViewingSlot } from '@/types/virtual-tour';

export const tourRooms: TourRoom[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    description:
      'Bright open-plan living area with east-facing windows and space for a full lounge set.',
    highlights: ['Natural light', 'Open-plan layout', 'Built-in AC'],
    gradient: 'from-amber-200 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/20',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    description:
      'Fully fitted kitchen with granite countertops and space for a fridge and gas cooker.',
    highlights: ['Granite countertops', 'Fitted cabinets', 'Water heater'],
    gradient: 'from-sky-200 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/20',
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    description: 'Spacious en-suite bedroom with a built-in wardrobe and balcony access.',
    highlights: ['En-suite bathroom', 'Built-in wardrobe', 'Balcony access'],
    gradient: 'from-violet-200 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/20',
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    description: 'Modern tiled bathroom with a walk-in shower and constant water supply.',
    highlights: ['Walk-in shower', 'Modern tiling', '24/7 water supply'],
    gradient: 'from-teal-200 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/20',
  },
  {
    id: 'exterior',
    name: 'Exterior & Compound',
    description: 'Gated compound with dedicated parking and 24-hour security.',
    highlights: ['Dedicated parking', '24-hour security', 'Gated compound'],
    gradient: 'from-lime-200 to-green-100 dark:from-lime-900/40 dark:to-green-900/20',
  },
];

export const videoViewingSlots: VideoViewingSlot[] = [
  { id: 'slot_1', label: 'Today, 4:00 PM' },
  { id: 'slot_2', label: 'Tomorrow, 10:00 AM' },
  { id: 'slot_3', label: 'Tomorrow, 2:00 PM' },
  { id: 'slot_4', label: 'Saturday, 11:00 AM' },
];
