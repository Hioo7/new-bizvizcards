import { randomUUID } from 'crypto';
import ExcelJS from 'exceljs';
import { AppConfigService } from '../../../common/config/app-config.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LeadExportService } from './lead-export.service';

async function readRows(buffer: Buffer): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet('Leads')!;
  const headerRow = worksheet.getRow(1).values as unknown[];
  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values as unknown[];
    const record: Record<string, unknown> = {};
    headerRow.forEach((header, index) => {
      if (typeof header === 'string') record[header] = values[index];
    });
    rows.push(record);
  });
  return rows;
}

describe('LeadExportService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let service: LeadExportService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    service = new LeadExportService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
  });

  async function seedCustomer() {
    const account = await prisma.customerAccount.create({
      data: {
        name: 'Test Customer',
        email: `lead-export-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  it('exports only the requested, owned leads with the expected columns', async () => {
    const customer = await seedCustomer();
    const folder = await prisma.leadFolder.create({
      data: { customerId: customer.id, name: 'VIP' },
    });
    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        name: 'Alice',
        email: 'alice@example.com',
        countryDialCode: '91',
        phoneNumber: '9876543210',
        company: 'Acme',
        profession: 'Engineer',
        location: 'Delhi',
        note: 'Met at expo',
        folderId: folder.id,
      },
    });

    const buffer = await service.generateWorkbook(customer.id, [lead.id]);
    const rows = await readRows(buffer);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Name: 'Alice',
      Email: 'alice@example.com',
      Phone: '+91 9876543210',
      Company: 'Acme',
      Profession: 'Engineer',
      Location: 'Delhi',
      Folder: 'VIP',
      Note: 'Met at expo',
    });
  });

  it('labels a lead with no folder as Uncategorised', async () => {
    const customer = await seedCustomer();
    const lead = await prisma.lead.create({
      data: { customerId: customer.id, name: 'Bob' },
    });

    const buffer = await service.generateWorkbook(customer.id, [lead.id]);
    const rows = await readRows(buffer);

    expect(rows).toHaveLength(1);
    expect(rows[0].Folder).toBe('Uncategorised');
    expect(rows[0].Email).toBe('');
    expect(rows[0].Phone).toBe('');
  });

  it('silently excludes ids belonging to another customer', async () => {
    const customerA = await seedCustomer();
    const customerB = await seedCustomer();
    const ownLead = await prisma.lead.create({
      data: { customerId: customerA.id, name: 'Own Lead' },
    });
    const foreignLead = await prisma.lead.create({
      data: { customerId: customerB.id, name: 'Foreign Lead' },
    });

    const buffer = await service.generateWorkbook(customerA.id, [
      ownLead.id,
      foreignLead.id,
    ]);
    const rows = await readRows(buffer);

    expect(rows.map((r) => r.Name)).toEqual(['Own Lead']);
  });

  it('silently excludes nonexistent ids', async () => {
    const customer = await seedCustomer();
    const lead = await prisma.lead.create({
      data: { customerId: customer.id, name: 'Real Lead' },
    });

    const buffer = await service.generateWorkbook(customer.id, [
      lead.id,
      randomUUID(),
    ]);
    const rows = await readRows(buffer);

    expect(rows.map((r) => r.Name)).toEqual(['Real Lead']);
  });
});
