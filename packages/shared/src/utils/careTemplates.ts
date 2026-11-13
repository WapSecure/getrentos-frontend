import type { MaintenanceCategoryCode } from './maintenance';

// Preventive-care routines common in Nigerian homes. Intervals are typical, not rules: the owner
// edits every field before the plan is saved.

export type CareTemplate = {
  id: string;
  title: string;
  category: MaintenanceCategoryCode;
  frequencyDays: number;
  /** Plain description of the interval, e.g. "Every 3 months". */
  frequencyLabel: string;
  /** For seasonal jobs: the month (1 to 12) the job should fall in, e.g. 3 for before the rains. */
  dueMonth?: number;
  summary: string;
  checklist: string[];
};

export const CARE_TEMPLATES: CareTemplate[] = [
  {
    id: 'generator-servicing',
    title: 'Generator servicing',
    category: 'GENERATOR_POWER',
    frequencyDays: 90,
    frequencyLabel: 'Every 3 months',
    summary:
      'Typically every 3 months. Busy generators need an oil and filter change every 150 to 250 running hours, so service sooner if it runs most days.',
    checklist: [
      'Change the engine oil and oil filter',
      'Clean or replace the air filter',
      'Check the fuel filter, fuel lines and battery terminals',
      'Test the changeover switch and run the generator under load',
    ],
  },
  {
    id: 'fumigation',
    title: 'Fumigation',
    category: 'PEST_CONTROL',
    frequencyDays: 90,
    frequencyLabel: 'Every 3 months',
    summary: 'Typically every 3 months to keep cockroaches, rodents and termites away.',
    checklist: [
      'Treat the kitchen, stores, drains and roof space',
      'Seal gaps where pests get in',
      'Tell residents when it is safe to go back in',
    ],
  },
  {
    id: 'overhead-tank-cleaning',
    title: 'Overhead tank cleaning',
    category: 'WATER_BOREHOLE',
    frequencyDays: 182,
    frequencyLabel: 'Every 6 months',
    summary: 'Typically every 6 months, or sooner if the water looks or smells off.',
    checklist: [
      'Drain the tank and scrub the walls and floor',
      'Disinfect and rinse before refilling',
      'Check the lid seal and the float valve',
    ],
  },
  {
    id: 'borehole-pump-servicing',
    title: 'Borehole and pump servicing',
    category: 'WATER_BOREHOLE',
    frequencyDays: 182,
    frequencyLabel: 'Every 6 months',
    summary: 'Typically every 6 months to catch pump wear before the water stops.',
    checklist: [
      'Check pump pressure and flow',
      'Inspect the pump controller, wiring and surge protection',
      'Look for sand or cloudy water',
      'Check pipes and valves for leaks',
    ],
  },
  {
    id: 'water-treatment-filter-change',
    title: 'Water treatment filter change',
    category: 'WATER_BOREHOLE',
    frequencyDays: 90,
    frequencyLabel: 'Every 3 months',
    summary: 'Typically every 3 months. Hard or iron-rich borehole water may need it sooner.',
    checklist: [
      'Replace the sediment and carbon cartridges',
      'Clean the filter housings',
      'Check the water is clear after the change',
    ],
  },
  {
    id: 'air-conditioner-servicing',
    title: 'Air conditioner servicing',
    category: 'AIR_CONDITIONING',
    frequencyDays: 90,
    frequencyLabel: 'Every 3 months',
    summary: 'Typically every 3 months for units that run daily.',
    checklist: [
      'Wash the filters',
      'Clean the indoor and outdoor coils',
      'Clear the drain line',
      'Check the gas level and that the room cools properly',
    ],
  },
  {
    id: 'drain-clearing',
    title: 'Drain clearing before the rains',
    category: 'DRAINAGE',
    frequencyDays: 365,
    frequencyLabel: 'Yearly, in March',
    dueMonth: 3,
    summary: 'Typically once a year in March, before the rainy season starts.',
    checklist: [
      'Clear gutters, gullies and compound drains of sand and refuse',
      'Check soakaway and septic tank levels',
      'Replace broken drain covers',
    ],
  },
  {
    id: 'roof-inspection',
    title: 'Roof inspection before the rains',
    category: 'ROOFING',
    frequencyDays: 365,
    frequencyLabel: 'Yearly, in March',
    dueMonth: 3,
    summary: 'Typically once a year in March, before the rainy season starts.',
    checklist: [
      'Check roofing sheets, nails and flashing for rust or gaps',
      'Clear leaves and debris from valleys and gutters',
      'Look for ceiling stains that point to a leak',
    ],
  },
  {
    id: 'fire-extinguisher-check',
    title: 'Fire extinguisher check',
    category: 'SECURITY',
    frequencyDays: 365,
    frequencyLabel: 'Every 12 months',
    summary: 'Typically every 12 months, with a quick look at the gauge each month.',
    checklist: [
      'Check the pressure gauge reads in the green',
      'Check the pin, seal and hose',
      'Refill or replace any that are used, damaged or out of date',
      'Make sure each one is easy to reach',
    ],
  },
  {
    id: 'inverter-battery-check',
    title: 'Inverter and battery check',
    category: 'GENERATOR_POWER',
    frequencyDays: 182,
    frequencyLabel: 'Every 6 months',
    summary: 'Typically every 6 months to keep backup time up.',
    checklist: [
      'Clean and tighten the battery terminals',
      'Top up distilled water on flooded batteries',
      'Check the inverter fans and vents are clear',
      'Test the backup time on a full charge',
    ],
  },
];

export function findCareTemplate(id: string | null | undefined): CareTemplate | undefined {
  return id ? CARE_TEMPLATES.find((template) => template.id === id) : undefined;
}

/** The checklist as plain text for the plan's notes field. */
export function careTemplateNotes(template: CareTemplate): string {
  return template.checklist.map((item) => `- ${item}`).join('\n');
}

const pad = (value: number) => String(value).padStart(2, '0');
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Suggested first due date (YYYY-MM-DD, local time). Seasonal jobs fall on the 1st of their month,
 * this year if it is still ahead, otherwise next year. Others start in 7 days.
 */
export function careTemplateFirstDueDate(template: CareTemplate, from: Date = new Date()): string {
  if (template.dueMonth) {
    const thisYear = new Date(from.getFullYear(), template.dueMonth - 1, 1);
    const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    return isoDate(
      thisYear.getTime() >= today.getTime()
        ? thisYear
        : new Date(from.getFullYear() + 1, template.dueMonth - 1, 1)
    );
  }
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
  return isoDate(next);
}
