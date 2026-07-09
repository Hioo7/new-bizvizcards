import { Injectable } from '@nestjs/common';

export interface VCardSourceData {
  companyName?: string | null;
  founderName?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
}

@Injectable()
export class SmartCardVCardService {
  buildVCardText(data: VCardSourceData): string {
    const displayName = data.founderName ?? data.companyName ?? '';

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${this.escape(displayName)}`,
      `N:${this.escape(displayName)};;;;`,
    ];

    if (data.companyName) {
      lines.push(`ORG:${this.escape(data.companyName)}`);
    }
    if (data.contactNumber) {
      lines.push(`TEL;TYPE=CELL:${this.escape(data.contactNumber)}`);
    }
    if (data.email) {
      lines.push(`EMAIL:${this.escape(data.email)}`);
    }
    if (data.address) {
      lines.push(`ADR;TYPE=WORK:;;${this.escape(data.address)};;;;`);
    }
    if (data.website) {
      lines.push(`URL:${this.escape(data.website)}`);
    }

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
