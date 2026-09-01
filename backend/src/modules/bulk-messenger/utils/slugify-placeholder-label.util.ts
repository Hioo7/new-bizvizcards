// Deterministic label -> placeholder-slug conversion, shared by the authoring
// placeholder list and by send-time answer resolution so a lead's answers
// (possibly captured under an older form version) map to the same token the
// template body was written against.

// Lowercase, non-alphanumeric runs collapsed to `_`, leading/trailing `_`
// trimmed. A label made entirely of symbols collapses to '' — callers fall
// back to a stable placeholder (see resolveFormFieldSlugs).
export function slugifyPlaceholderLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Given a list of field labels in form order, returns one slug per label,
// disambiguating collisions with a numeric suffix (`_2`, `_3`, …) by order of
// appearance. Stable: the same input always yields the same output.
export function resolveFormFieldSlugs(labels: readonly string[]): string[] {
  const seenCounts = new Map<string, number>();
  return labels.map((label) => {
    const base = slugifyPlaceholderLabel(label) || 'field';
    const seen = seenCounts.get(base) ?? 0;
    seenCounts.set(base, seen + 1);
    return seen === 0 ? base : `${base}_${seen + 1}`;
  });
}
