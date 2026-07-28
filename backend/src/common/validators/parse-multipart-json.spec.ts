import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { parseMultipartJson } from './parse-multipart-json';

// Checklist:
// - valid JSON matching the schema -> returns the parsed data
// - malformed JSON string -> throws BadRequestException with a plain string message
// - valid JSON that fails schema validation -> throws BadRequestException carrying
//   the structured fieldErrors envelope

describe('parseMultipartJson', () => {
  const schema = z.object({ endpoint: z.string() });

  it('returns the parsed data for valid JSON matching the schema', () => {
    const result = parseMultipartJson(
      schema,
      JSON.stringify({ endpoint: 'jane-doe' }),
    );

    expect(result).toEqual({ endpoint: 'jane-doe' });
  });

  it('throws a plain BadRequestException for malformed JSON', () => {
    expect(() => parseMultipartJson(schema, '{not json')).toThrow(
      BadRequestException,
    );
    try {
      parseMultipartJson(schema, '{not json');
      throw new Error('expected parseMultipartJson to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).message).toBe(
        'Invalid JSON in "data" field',
      );
    }
  });

  it('throws a BadRequestException with structured fieldErrors for schema failures', () => {
    try {
      parseMultipartJson(schema, JSON.stringify({}));
      throw new Error('expected parseMultipartJson to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const response = (err as BadRequestException).getResponse() as {
        fieldErrors: { field: string; message: string }[];
      };
      expect(response.fieldErrors).toEqual([
        { field: 'endpoint', message: 'Endpoint is required' },
      ]);
    }
  });
});
