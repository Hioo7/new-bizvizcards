// Happy path:
// - every core token is substituted from the lead's scalar fields
// - {phone} joins dial code + number
// - form tokens resolve from the pre-stringified answer map
// - a token repeated in the body is replaced everywhere
// Sad path:
// - a missing core field resolves to '' (never a literal {token})
// - {phone} with neither part resolves to ''
// - an unknown / typo token resolves to ''
// - a body with no tokens is returned unchanged
// - findUnknownPlaceholderTokens flags only the tokens outside the available set
import { BulkMessageLeadCoreFields } from '../bulk-messenger.constants';
import {
  extractPlaceholderTokens,
  findUnknownPlaceholderTokens,
  resolveBulkMessagePlaceholders,
} from './resolve-bulk-message-placeholders.util';

const FULL_LEAD: BulkMessageLeadCoreFields = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  countryDialCode: '+44',
  phoneNumber: '7700900123',
  company: 'Analytical Engines',
  profession: 'Mathematician',
  note: 'Met at the expo',
  location: 'London',
};

const EMPTY_LEAD: BulkMessageLeadCoreFields = {
  name: 'No Contact',
  email: null,
  countryDialCode: null,
  phoneNumber: null,
  company: null,
  profession: null,
  note: null,
  location: null,
};

describe('resolveBulkMessagePlaceholders', () => {
  it('substitutes every core token', () => {
    const result = resolveBulkMessagePlaceholders({
      body: '{name} / {email} / {phone} / {company} / {profession} / {note} / {location}',
      lead: FULL_LEAD,
      formAnswerValueBySlug: new Map(),
    });
    expect(result).toBe(
      'Ada Lovelace / ada@example.com / +44 7700900123 / Analytical Engines / Mathematician / Met at the expo / London',
    );
  });

  it('resolves {phone} to an empty string when neither part is set', () => {
    const result = resolveBulkMessagePlaceholders({
      body: 'Hi {name}, call me on {phone}.',
      lead: EMPTY_LEAD,
      formAnswerValueBySlug: new Map(),
    });
    expect(result).toBe('Hi No Contact, call me on .');
  });

  it('resolves a missing core field to an empty string with no literal token left', () => {
    const result = resolveBulkMessagePlaceholders({
      body: 'Hello {name} from {company}!',
      lead: EMPTY_LEAD,
      formAnswerValueBySlug: new Map(),
    });
    expect(result).toBe('Hello No Contact from !');
    expect(result).not.toContain('{company}');
  });

  it('resolves form tokens from the answer map', () => {
    const result = resolveBulkMessagePlaceholders({
      body: 'Budget: {field.budget}, Start: {field.start_date}',
      lead: FULL_LEAD,
      formAnswerValueBySlug: new Map([
        ['budget', '$5,000'],
        ['start_date', '2026-10-01'],
      ]),
    });
    expect(result).toBe('Budget: $5,000, Start: 2026-10-01');
  });

  it('matches tokens case-insensitively', () => {
    expect(
      resolveBulkMessagePlaceholders({
        body: '{Name} {NAME}',
        lead: FULL_LEAD,
        formAnswerValueBySlug: new Map(),
      }),
    ).toBe('Ada Lovelace Ada Lovelace');
  });

  it('replaces every occurrence of a repeated token', () => {
    expect(
      resolveBulkMessagePlaceholders({
        body: '{name}, {name}, {name}',
        lead: FULL_LEAD,
        formAnswerValueBySlug: new Map(),
      }),
    ).toBe('Ada Lovelace, Ada Lovelace, Ada Lovelace');
  });

  it('resolves an unknown token to an empty string', () => {
    expect(
      resolveBulkMessagePlaceholders({
        body: 'Hi {naem}',
        lead: FULL_LEAD,
        formAnswerValueBySlug: new Map(),
      }),
    ).toBe('Hi ');
  });

  it('returns a body with no tokens unchanged', () => {
    expect(
      resolveBulkMessagePlaceholders({
        body: 'Just a plain message.',
        lead: FULL_LEAD,
        formAnswerValueBySlug: new Map(),
      }),
    ).toBe('Just a plain message.');
  });
});

describe('extractPlaceholderTokens', () => {
  it('returns unique lowercased tokens', () => {
    expect(
      extractPlaceholderTokens('{name} {Name} {field.a} plain {field.a}'),
    ).toEqual(['name', 'field.a']);
  });
});

describe('findUnknownPlaceholderTokens', () => {
  it('returns only tokens outside the available set', () => {
    const available = new Set(['name', 'field.budget']);
    expect(
      findUnknownPlaceholderTokens(
        'Hi {name}, budget {field.budget}, bogus {field.nope}',
        available,
      ),
    ).toEqual(['field.nope']);
  });

  it('returns an empty array when every token is available', () => {
    expect(findUnknownPlaceholderTokens('{name}', new Set(['name']))).toEqual(
      [],
    );
  });
});
