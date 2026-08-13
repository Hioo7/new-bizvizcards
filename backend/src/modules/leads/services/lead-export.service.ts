import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  LEAD_EXPORT_COLUMNS,
  LEAD_EXPORT_SHEET_NAME,
  LEAD_EXPORT_UNCATEGORISED_FOLDER_LABEL,
} from '../leads.constants';

@Injectable()
export class LeadExportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateWorkbook(
    customerId: string,
    leadIds: string[],
  ): Promise<Buffer> {
    // The `customerId` filter here is the entire authorization boundary: any
    // id in `leadIds` that belongs to another customer (or doesn't exist) is
    // silently dropped from the result set rather than erroring, matching
    // LeadsService's existing ownership-scoping pattern.
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: leadIds }, customerId },
      include: { folder: true },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(LEAD_EXPORT_SHEET_NAME);
    worksheet.columns = LEAD_EXPORT_COLUMNS;

    for (const lead of leads) {
      worksheet.addRow({
        name: lead.name,
        email: lead.email ?? '',
        phone: formatPhone(lead.countryDialCode, lead.phoneNumber),
        company: lead.company ?? '',
        profession: lead.profession ?? '',
        location: lead.location ?? '',
        folder: lead.folder?.name ?? LEAD_EXPORT_UNCATEGORISED_FOLDER_LABEL,
        note: lead.note ?? '',
        createdAt: lead.createdAt.toISOString().split('T')[0],
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

function formatPhone(
  countryDialCode: string | null,
  phoneNumber: string | null,
): string {
  if (!phoneNumber) return '';
  return countryDialCode ? `+${countryDialCode} ${phoneNumber}` : phoneNumber;
}
