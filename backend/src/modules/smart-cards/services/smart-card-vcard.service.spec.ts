import { SmartCardVCardService } from './smart-card-vcard.service';

describe('SmartCardVCardService', () => {
  const service = new SmartCardVCardService();

  it('builds a vCard 3.0 payload from full card data', () => {
    const text = service.buildVCardText({
      companyName: 'Acme Interiors',
      founderName: 'Jane Doe',
      contactNumber: '+1 555 0100',
      email: 'jane@acme.test',
      address: '123 Main St',
      website: 'https://acme.test',
    });

    expect(text).toContain('BEGIN:VCARD');
    expect(text).toContain('VERSION:3.0');
    expect(text).toContain('FN:Jane Doe');
    expect(text).toContain('ORG:Acme Interiors');
    expect(text).toContain('TEL;TYPE=CELL:+1 555 0100');
    expect(text).toContain('EMAIL:jane@acme.test');
    expect(text).toContain('URL:https://acme.test');
    expect(text).toContain('END:VCARD');
  });

  it('falls back to companyName as the display name when no founder is set', () => {
    const text = service.buildVCardText({ companyName: 'Acme Interiors' });

    expect(text).toContain('FN:Acme Interiors');
  });

  it('omits optional fields that are absent', () => {
    const text = service.buildVCardText({});

    expect(text).not.toContain('ORG:');
    expect(text).not.toContain('TEL');
    expect(text).not.toContain('EMAIL:');
    expect(text).not.toContain('ADR');
    expect(text).not.toContain('URL:');
  });

  it('escapes special characters per vCard 3.0 rules', () => {
    const text = service.buildVCardText({
      companyName: 'Smith, Jones; & Co\\Corp',
    });

    expect(text).toContain('ORG:Smith\\, Jones\\; & Co\\\\Corp');
  });
});
