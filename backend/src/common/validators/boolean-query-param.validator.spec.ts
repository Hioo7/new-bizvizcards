import { booleanQueryParamSchema } from './boolean-query-param.validator';

describe('booleanQueryParamSchema', () => {
  it('parses "true" to true', () => {
    expect(booleanQueryParamSchema.parse('true')).toBe(true);
  });

  it('parses "false" to false', () => {
    expect(booleanQueryParamSchema.parse('false')).toBe(false);
  });

  it('rejects any other string', () => {
    expect(() => booleanQueryParamSchema.parse('0')).toThrow();
    expect(() => booleanQueryParamSchema.parse('')).toThrow();
  });
});
