import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

// Checklist:
// - valid value -> returns the parsed/transformed value
// - invalid value -> throws BadRequestException carrying the structured fieldErrors envelope

describe('ZodValidationPipe', () => {
  const schema = z.object({ endpoint: z.string() });

  it('returns the parsed value when it matches the schema', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(pipe.transform({ endpoint: 'jane-doe' })).toEqual({
      endpoint: 'jane-doe',
    });
  });

  it('throws a BadRequestException with structured fieldErrors when validation fails', () => {
    const pipe = new ZodValidationPipe(schema);

    try {
      pipe.transform({});
      throw new Error('expected transform to throw');
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
