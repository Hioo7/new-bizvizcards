import type { ResolvedFormFieldForMapping } from './map-custom-form-answers.util';
import { mapCustomFormAnswersToLeadFields } from './map-custom-form-answers.util';

// Checklist (enumerated before writing cases, per backend/CLAUDE.md):
// Happy path — each core tag routes into its corresponding Lead field;
// untagged SHORT_TEXT/LONG_TEXT/DATE/MULTIPLE_CHOICE/DROPDOWN answers land in
// customAnswers with the right `kind`; an optional field left unanswered is
// simply skipped.
// Sad path — missing answer for a required field; answer for an unknown
// fieldId; duplicate answers for the same field; answer.type not matching
// the field's own type; MULTIPLE_CHOICE/DROPDOWN answer selecting an option
// that doesn't belong to its field.
describe('mapCustomFormAnswersToLeadFields', () => {
  const nameField: ResolvedFormFieldForMapping = {
    id: 'field-name',
    type: 'SHORT_TEXT',
    tag: 'LEAD_NAME',
    isRequired: true,
    options: [],
  };

  it('routes each core tag into its corresponding Lead field', () => {
    const fields: ResolvedFormFieldForMapping[] = [
      nameField,
      {
        id: 'field-email',
        type: 'EMAIL',
        tag: 'LEAD_EMAIL',
        isRequired: false,
        options: [],
      },
      {
        id: 'field-phone',
        type: 'PHONE',
        tag: 'LEAD_PHONE',
        isRequired: false,
        options: [],
      },
      {
        id: 'field-note',
        type: 'LONG_TEXT',
        tag: 'LEAD_NOTE',
        isRequired: false,
        options: [],
      },
      {
        id: 'field-location',
        type: 'LOCATION',
        tag: 'LEAD_LOCATION',
        isRequired: false,
        options: [],
      },
      {
        id: 'field-company',
        type: 'SHORT_TEXT',
        tag: 'LEAD_COMPANY',
        isRequired: false,
        options: [],
      },
      {
        id: 'field-profession',
        type: 'SHORT_TEXT',
        tag: 'LEAD_PROFESSION',
        isRequired: false,
        options: [],
      },
    ];

    const result = mapCustomFormAnswersToLeadFields(fields, [
      { fieldId: 'field-name', type: 'SHORT_TEXT', value: 'Jane Doe' },
      { fieldId: 'field-email', type: 'EMAIL', value: 'jane@example.com' },
      {
        fieldId: 'field-phone',
        type: 'PHONE',
        countryDialCode: '+1',
        phoneNumber: '5551234567',
      },
      { fieldId: 'field-note', type: 'LONG_TEXT', value: 'Interested' },
      {
        fieldId: 'field-location',
        type: 'LOCATION',
        latitude: 12.5,
        longitude: 45.5,
      },
      { fieldId: 'field-company', type: 'SHORT_TEXT', value: 'Acme' },
      {
        fieldId: 'field-profession',
        type: 'SHORT_TEXT',
        value: 'Engineer',
      },
    ]);

    expect(result.leadFields).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      countryDialCode: '+1',
      phoneNumber: '5551234567',
      note: 'Interested',
      locationLatitude: 12.5,
      locationLongitude: 45.5,
      company: 'Acme',
      profession: 'Engineer',
    });
    expect(result.customAnswers).toEqual([]);
  });

  it('routes untagged custom answers into customAnswers with the right kind', () => {
    const dateValue = new Date('2026-05-01');
    const fields: ResolvedFormFieldForMapping[] = [
      nameField,
      {
        id: 'field-short',
        type: 'SHORT_TEXT',
        tag: null,
        isRequired: false,
        options: [],
      },
      {
        id: 'field-mcq',
        type: 'MULTIPLE_CHOICE',
        tag: null,
        isRequired: false,
        options: [{ id: 'opt-1' }, { id: 'opt-2' }],
      },
      {
        id: 'field-date',
        type: 'DATE',
        tag: null,
        isRequired: false,
        options: [],
      },
    ];

    const result = mapCustomFormAnswersToLeadFields(fields, [
      { fieldId: 'field-name', type: 'SHORT_TEXT', value: 'Jane Doe' },
      { fieldId: 'field-short', type: 'SHORT_TEXT', value: 'Blue' },
      { fieldId: 'field-mcq', type: 'MULTIPLE_CHOICE', optionId: 'opt-2' },
      { fieldId: 'field-date', type: 'DATE', value: dateValue },
    ]);

    expect(result.leadFields.name).toBe('Jane Doe');
    expect(result.customAnswers).toEqual([
      { fieldId: 'field-short', kind: 'TEXT', value: 'Blue' },
      { fieldId: 'field-mcq', kind: 'CHOICE', selectedOptionId: 'opt-2' },
      { fieldId: 'field-date', kind: 'DATE', value: dateValue },
    ]);
  });

  it('skips an optional field left unanswered', () => {
    const fields: ResolvedFormFieldForMapping[] = [
      nameField,
      {
        id: 'field-email',
        type: 'EMAIL',
        tag: 'LEAD_EMAIL',
        isRequired: false,
        options: [],
      },
    ];

    const result = mapCustomFormAnswersToLeadFields(fields, [
      { fieldId: 'field-name', type: 'SHORT_TEXT', value: 'Jane Doe' },
    ]);

    expect(result.leadFields.email).toBeUndefined();
  });

  it('throws when a required field has no answer', () => {
    expect(() => mapCustomFormAnswersToLeadFields([nameField], [])).toThrow(
      'A required field is missing an answer',
    );
  });

  it('throws when an answer references an unknown fieldId', () => {
    expect(() =>
      mapCustomFormAnswersToLeadFields(
        [nameField],
        [
          { fieldId: 'field-name', type: 'SHORT_TEXT', value: 'Jane Doe' },
          { fieldId: 'not-a-real-field', type: 'SHORT_TEXT', value: 'x' },
        ],
      ),
    ).toThrow(
      'Submission includes an answer for a field that is not part of this form',
    );
  });

  it('throws when the same field receives two answers', () => {
    const fields: ResolvedFormFieldForMapping[] = [
      nameField,
      {
        id: 'field-email',
        type: 'EMAIL',
        tag: 'LEAD_EMAIL',
        isRequired: false,
        options: [],
      },
    ];

    expect(() =>
      mapCustomFormAnswersToLeadFields(fields, [
        { fieldId: 'field-name', type: 'SHORT_TEXT', value: 'Jane Doe' },
        { fieldId: 'field-email', type: 'EMAIL', value: 'a@example.com' },
        { fieldId: 'field-email', type: 'EMAIL', value: 'b@example.com' },
      ]),
    ).toThrow('Submission includes more than one answer for the same field');
  });

  it("throws when an answer's type does not match its field's type", () => {
    expect(() =>
      mapCustomFormAnswersToLeadFields(
        [nameField],
        [{ fieldId: 'field-name', type: 'DATE', value: new Date() }],
      ),
    ).toThrow('An answer does not match its field’s type');
  });

  it('throws when a MULTIPLE_CHOICE answer selects an option that does not belong to its field', () => {
    const fields: ResolvedFormFieldForMapping[] = [
      nameField,
      {
        id: 'field-mcq',
        type: 'MULTIPLE_CHOICE',
        tag: null,
        isRequired: false,
        options: [{ id: 'opt-1' }],
      },
    ];

    expect(() =>
      mapCustomFormAnswersToLeadFields(fields, [
        { fieldId: 'field-name', type: 'SHORT_TEXT', value: 'Jane Doe' },
        {
          fieldId: 'field-mcq',
          type: 'MULTIPLE_CHOICE',
          optionId: 'not-an-option',
        },
      ]),
    ).toThrow('An answer selects an option that does not belong to its field');
  });
});
