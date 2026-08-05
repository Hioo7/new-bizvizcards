import {
  exchangeContactFormFieldSchema,
  exchangeContactFormFieldsSchema,
} from './exchange-contact-form-field.dto';

function nameField(overrides: Record<string, unknown> = {}) {
  return {
    type: 'SHORT_TEXT',
    tag: 'LEAD_NAME',
    label: 'Name',
    isRequired: true,
    ...overrides,
  };
}

describe('exchangeContactFormFieldSchema', () => {
  it('accepts a SHORT_TEXT field tagged LEAD_NAME', () => {
    expect(exchangeContactFormFieldSchema.safeParse(nameField()).success).toBe(
      true,
    );
  });

  it('accepts an untagged SHORT_TEXT custom question', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'SHORT_TEXT',
      label: 'Favourite colour?',
      isRequired: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a SHORT_TEXT field tagged with a tag from a different type (tag/type mismatch)', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'SHORT_TEXT',
      tag: 'LEAD_PHONE',
      label: 'Name',
      isRequired: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a PHONE field with no tag (PHONE is core-only, tag is fixed not optional)', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'PHONE',
      label: 'Phone',
      isRequired: true,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a PHONE field tagged LEAD_PHONE', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'PHONE',
      tag: 'LEAD_PHONE',
      label: 'Phone',
      isRequired: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a MULTIPLE_CHOICE field with fewer than the minimum options', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'MULTIPLE_CHOICE',
      label: 'Pick one',
      isRequired: false,
      options: [{ label: 'Only option' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a DROPDOWN field with enough options', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'DROPDOWN',
      label: 'Pick one',
      isRequired: false,
      options: [{ label: 'A' }, { label: 'B' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a DATE field carrying a tag (DATE has no core tag)', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'DATE',
      tag: 'LEAD_NAME',
      label: 'When?',
      isRequired: false,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a bare BREAK field (no label/helpText/isRequired/tag)', () => {
    const result = exchangeContactFormFieldSchema.safeParse({ type: 'BREAK' });
    expect(result.success).toBe(true);
  });

  it('rejects a BREAK field carrying a label (structural marker, not a question)', () => {
    const result = exchangeContactFormFieldSchema.safeParse({
      type: 'BREAK',
      label: 'Step 2',
    });
    expect(result.success).toBe(false);
  });
});

describe('exchangeContactFormFieldsSchema', () => {
  it('accepts a field list with exactly one LEAD_NAME-tagged field', () => {
    const result = exchangeContactFormFieldsSchema.safeParse([nameField()]);
    expect(result.success).toBe(true);
  });

  it('rejects a field list missing a LEAD_NAME-tagged field', () => {
    const result = exchangeContactFormFieldsSchema.safeParse([
      { type: 'SHORT_TEXT', label: 'Favourite colour?', isRequired: false },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a field list whose Name field is not marked required', () => {
    const result = exchangeContactFormFieldsSchema.safeParse([
      nameField({ isRequired: false }),
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a field list with more than one LEAD_NAME-tagged field', () => {
    const result = exchangeContactFormFieldsSchema.safeParse([
      nameField(),
      nameField({ label: 'Full name' }),
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a field list with the same core tag used twice', () => {
    const result = exchangeContactFormFieldsSchema.safeParse([
      nameField(),
      {
        type: 'EMAIL',
        tag: 'LEAD_EMAIL',
        label: 'Email',
        isRequired: false,
      },
      {
        type: 'EMAIL',
        tag: 'LEAD_EMAIL',
        label: 'Work email',
        isRequired: false,
      },
    ]);
    expect(result.success).toBe(false);
  });

  it('allows multiple untagged custom questions of the same type', () => {
    const result = exchangeContactFormFieldsSchema.safeParse([
      nameField(),
      { type: 'SHORT_TEXT', label: 'Question 1', isRequired: false },
      { type: 'SHORT_TEXT', label: 'Question 2', isRequired: false },
    ]);
    expect(result.success).toBe(true);
  });

  describe('BREAK placement', () => {
    const shortText = (label: string) => ({
      type: 'SHORT_TEXT',
      label,
      isRequired: false,
    });
    const location = () => ({
      type: 'LOCATION',
      tag: 'LEAD_LOCATION',
      label: 'Location',
      isRequired: false,
    });
    const brk = () => ({ type: 'BREAK' });

    it('accepts a BREAK with a real field on both sides', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        nameField(),
        brk(),
        shortText('Question 1'),
      ]);
      expect(result.success).toBe(true);
    });

    it('accepts multiple BREAKs, each with real fields on both sides', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        nameField(),
        brk(),
        shortText('Question 1'),
        brk(),
        shortText('Question 2'),
      ]);
      expect(result.success).toBe(true);
    });

    it('rejects a leading BREAK (as the very first field)', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        brk(),
        nameField(),
      ]);
      expect(result.success).toBe(false);
    });

    it('rejects a trailing BREAK (as the very last field)', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        nameField(),
        brk(),
      ]);
      expect(result.success).toBe(false);
    });

    it('rejects two consecutive BREAKs', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        nameField(),
        brk(),
        brk(),
        shortText('Question 1'),
      ]);
      expect(result.success).toBe(false);
    });

    it('rejects a BREAK immediately before the Location field', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        nameField(),
        shortText('Question 1'),
        brk(),
        location(),
      ]);
      expect(result.success).toBe(false);
    });

    it('rejects a BREAK immediately after the Location field', () => {
      const result = exchangeContactFormFieldsSchema.safeParse([
        nameField(),
        location(),
        brk(),
        shortText('Question 1'),
      ]);
      expect(result.success).toBe(false);
    });
  });
});
