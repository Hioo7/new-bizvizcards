import { z } from 'zod';
import { formatZodError } from './zod-error-formatter';

// Checklist:
// - missing required field -> humanized "<Field> is required" message
// - failed regex/min/max (not invalid_type) -> original zod issue message passthrough
// - multiple issues -> one fieldErrors entry per issue, in order
// - nested path -> field joined with '.'
// - envelope shape is always {statusCode: 400, error: 'Bad Request', message, fieldErrors}

describe('formatZodError', () => {
  it('humanizes a missing required field into "<Field> is required"', () => {
    const schema = z.object({ endpoint: z.string() });
    const result = schema.safeParse({});
    if (result.success) throw new Error('expected parse to fail');

    const formatted = formatZodError(result.error);

    expect(formatted.fieldErrors).toEqual([
      { field: 'endpoint', message: 'Endpoint is required' },
    ]);
  });

  it('splits a camelCase field name into spaced words', () => {
    const schema = z.object({ heroCompanyName: z.string() });
    const result = schema.safeParse({});
    if (result.success) throw new Error('expected parse to fail');

    const formatted = formatZodError(result.error);

    expect(formatted.fieldErrors).toEqual([
      { field: 'heroCompanyName', message: 'Hero company name is required' },
    ]);
  });

  it('passes through the original message for non-missing-field issues', () => {
    const schema = z.object({ endpoint: z.string().min(3, 'Too short') });
    const result = schema.safeParse({ endpoint: 'ab' });
    if (result.success) throw new Error('expected parse to fail');

    const formatted = formatZodError(result.error);

    expect(formatted.fieldErrors).toEqual([
      { field: 'endpoint', message: 'Too short' },
    ]);
  });

  it('returns one fieldErrors entry per issue, in order', () => {
    const schema = z.object({
      endpoint: z.string(),
      heroName: z.string(),
    });
    const result = schema.safeParse({});
    if (result.success) throw new Error('expected parse to fail');

    const formatted = formatZodError(result.error);

    expect(formatted.fieldErrors.map((e) => e.field)).toEqual([
      'endpoint',
      'heroName',
    ]);
  });

  it('joins a nested path with "."', () => {
    const schema = z.object({
      components: z.array(z.object({ type: z.string() })),
    });
    const result = schema.safeParse({ components: [{}] });
    if (result.success) throw new Error('expected parse to fail');

    const formatted = formatZodError(result.error);

    expect(formatted.fieldErrors[0].field).toBe('components.0.type');
  });

  it('always returns the standard envelope shape', () => {
    const schema = z.object({ endpoint: z.string() });
    const result = schema.safeParse({});
    if (result.success) throw new Error('expected parse to fail');

    const formatted = formatZodError(result.error);

    expect(formatted.statusCode).toBe(400);
    expect(formatted.error).toBe('Bad Request');
    expect(formatted.message).toBe('Validation failed');
  });
});
