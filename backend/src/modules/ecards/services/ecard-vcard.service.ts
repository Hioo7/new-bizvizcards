import { Injectable } from '@nestjs/common';

export interface EcardVCardSourceData {
  name: string;
  email: string;
  companyName?: string | null;
  phoneCountryDialCode?: string | null;
  phoneNumber?: string | null;
}

@Injectable()
export class EcardVCardService {
  buildVCardText(data: EcardVCardSourceData): string {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${this.escape(data.name)}`,
      `N:${this.escape(data.name)};;;;`,
    ];

    if (data.companyName) {
      lines.push(`ORG:${this.escape(data.companyName)}`);
    }
    if (data.phoneCountryDialCode && data.phoneNumber) {
      lines.push(
        `TEL;TYPE=CELL:${this.escape(`+${data.phoneCountryDialCode}${data.phoneNumber}`)}`,
      );
    }
    lines.push(`EMAIL:${this.escape(data.email)}`);

    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  private escape(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  }
}
