// Sentence-case names for maintenance categories, shared by the report form and request cards.
const LABELS: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  internet: 'Internet',
  security: 'Security',
  appliances: 'Appliances',
  other: 'Other',
};

export function maintenanceCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Other';
  const known = LABELS[category];
  if (known) return known;
  const words = category.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words ? words[0]!.toUpperCase() + words.slice(1) : 'Other';
}
