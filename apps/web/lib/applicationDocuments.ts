/** Words that identify each kind of application document, in a saved file's name or category. */
const KINDS: { slot: RegExp; file: RegExp }[] = [
  {
    slot: /government id|identity|\bid\b/i,
    file: /\b(id|identity|passport|licen[cs]e|nin|voter|national)\b/i,
  },
  {
    slot: /income|payslip|salary/i,
    file: /\b(income|pay\s?slips?|salary|employment|offer letter|earnings)\b/i,
  },
  { slot: /bank/i, file: /\b(bank|statement)\b/i },
  { slot: /reference/i, file: /\b(reference|referee|recommendation)\b/i },
  { slot: /credit/i, file: /\b(credit)\b/i },
];

const norm = (value: string) => value.trim().toLowerCase();

/** An unknown slot only takes a file of the same name, so an ID card is never offered as proof of income. */
export function savedDocumentFits(
  slotName: string,
  file: { name: string; category?: string | null }
): boolean {
  if (norm(file.name) === norm(slotName)) return true;
  const kind = KINDS.find((k) => k.slot.test(slotName));
  if (!kind) return false;
  const words = `${file.name} ${file.category ?? ''}`;
  // A file that names another kind first (an ID called "ID for income check") still counts as that other kind.
  const otherKind = KINDS.find(
    (k) => k !== kind && k.file.test(file.name) && !kind.file.test(file.name)
  );
  return kind.file.test(words) && !otherKind;
}
