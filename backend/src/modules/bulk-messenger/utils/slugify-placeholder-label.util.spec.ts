// Happy path:
// - spaces / punctuation / mixed case collapse to a lowercase snake_case slug
// - leading / trailing separators are trimmed
// - collisions get a stable numeric suffix by order of appearance
// Sad path:
// - a symbol-only label falls back to a stable `field` slug
// - the same input always produces the same output (deterministic)
import {
  resolveFormFieldSlugs,
  slugifyPlaceholderLabel,
} from './slugify-placeholder-label.util';

describe('slugifyPlaceholderLabel', () => {
  it('lowercases and collapses non-alphanumeric runs to underscore', () => {
    expect(slugifyPlaceholderLabel('Company Name')).toBe('company_name');
    expect(slugifyPlaceholderLabel('How many employees?')).toBe(
      'how_many_employees',
    );
    expect(slugifyPlaceholderLabel('  Budget ($USD)  ')).toBe('budget_usd');
  });

  it('trims leading and trailing separators', () => {
    expect(slugifyPlaceholderLabel('***important***')).toBe('important');
  });

  it('returns an empty string for a symbol-only label', () => {
    expect(slugifyPlaceholderLabel('***')).toBe('');
  });
});

describe('resolveFormFieldSlugs', () => {
  it('returns one slug per label in order', () => {
    expect(resolveFormFieldSlugs(['First Name', 'Last Name'])).toEqual([
      'first_name',
      'last_name',
    ]);
  });

  it('disambiguates colliding slugs with a numeric suffix by appearance', () => {
    expect(
      resolveFormFieldSlugs(['Reference', 'Reference', 'Reference']),
    ).toEqual(['reference', 'reference_2', 'reference_3']);
  });

  it('falls back to `field` for a symbol-only label and still disambiguates', () => {
    expect(resolveFormFieldSlugs(['***', '###'])).toEqual(['field', 'field_2']);
  });

  it('is deterministic across calls', () => {
    const labels = ['A', 'A', 'B'];
    expect(resolveFormFieldSlugs(labels)).toEqual(
      resolveFormFieldSlugs(labels),
    );
  });
});
