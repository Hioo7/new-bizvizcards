import { randomUUID } from 'crypto';
import { verifyCustomerPassword } from '../../../common/auth/customer-password-hasher';
import { AppConfigService } from '../../../common/config/app-config.service';
import { createCustomerAuth } from '../../../common/auth/customer-auth.factory';
import type { CustomerAuth } from '../../../common/auth/customer-auth.factory';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { MediaService } from '../../../common/media/media.service';
import { MediaSource } from '../../../generated/prisma/client';
import type {
  MediaStorageProvider,
  UploadMediaParams,
} from '../../../common/media/storage/media-storage-provider.interface';
import type { MediaStorageProviderRegistry } from '../../../common/media/storage/media-storage-provider-registry.provider';
import { CustomersService } from './customers.service';

class FakeMediaStorageProvider implements MediaStorageProvider {
  uploadedKeys: string[] = [];
  deletedKeys: string[] = [];

  upload(params: UploadMediaParams): Promise<void> {
    this.uploadedKeys.push(params.key);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.deletedKeys.push(key);
    return Promise.resolve();
  }

  getPublicUrl(key: string): string {
    return `/media/test-bucket/${key}`;
  }
}

describe('CustomersService (integration, TEST_DATABASE_URL only)', () => {
  let prisma: PrismaService;
  let appConfig: AppConfigService;
  let customerAuth: CustomerAuth;
  let fakeProvider: FakeMediaStorageProvider;
  let service: CustomersService;
  let originalDatabaseUrl: string | undefined;
  const seededAccountIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    appConfig = new AppConfigService();
    prisma = new PrismaService(appConfig);
    customerAuth = createCustomerAuth({
      secret: appConfig.betterAuthCustomerSecret,
      baseUrl: appConfig.betterAuthUrl,
      frontendOrigin: appConfig.publicAppBaseUrl,
      prisma,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(() => {
    fakeProvider = new FakeMediaStorageProvider();
    const registry: MediaStorageProviderRegistry = {
      [MediaSource.MINIO]: fakeProvider,
    };
    const mediaService = new MediaService(prisma, registry);
    service = new CustomersService(prisma, mediaService, customerAuth);
  });

  afterEach(async () => {
    if (seededAccountIds.length > 0) {
      // Media rows are unlinked/deleted by the service under test as
      // part of each flow; deleting the account cascades the Customer row.
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededAccountIds } },
      });
      seededAccountIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedCustomer(overrides?: { name?: string; email?: string }) {
    const account = await prisma.customerAccount.create({
      data: {
        name: overrides?.name ?? 'Test Customer',
        email:
          overrides?.email ?? `customers-service-${randomUUID()}@example.com`,
        emailVerified: true,
      },
    });
    seededAccountIds.push(account.id);
    return prisma.customer.create({ data: { accountId: account.id } });
  }

  async function seedPlan(name = `Test Plan ${randomUUID()}`) {
    const plan = await prisma.plan.create({
      data: { name, price: 0, businessModelType: 'ONE_TIME' },
    });
    seededPlanIds.push(plan.id);
    return plan;
  }

  it('resolves a customer by accountId', async () => {
    const customer = await seedCustomer();

    const resolved = await service.getByAccountId(customer.accountId);

    expect(resolved.id).toBe(customer.id);
  });

  it('replaces a profile picture under pfp/<customerId>/, linking the new media before deleting the old one', async () => {
    const customer = await seedCustomer();

    const afterFirstUpload = await service.replaceProfilePicture(customer.id, {
      buffer: Buffer.from('a'),
      contentType: 'image/png',
      originalName: 'a.png',
      extension: 'png',
    });
    expect(afterFirstUpload.customer.pfpMediaId).not.toBeNull();
    expect(fakeProvider.deletedKeys).toHaveLength(0);
    const firstMediaId = afterFirstUpload.customer.pfpMediaId as string;
    const firstMediaRow = await prisma.media.findUniqueOrThrow({
      where: { id: firstMediaId },
    });
    expect(firstMediaRow.storageKey).toBe(
      `pfp/${customer.id}/${firstMediaId}.png`,
    );
    expect(afterFirstUpload.pfpUrl).toBe(
      `/media/test-bucket/${firstMediaRow.storageKey}`,
    );

    const afterSecondUpload = await service.replaceProfilePicture(customer.id, {
      buffer: Buffer.from('b'),
      contentType: 'image/png',
      originalName: 'b.png',
      extension: 'png',
    });

    expect(afterSecondUpload.customer.pfpMediaId).not.toBe(firstMediaId);
    // The old media's row is gone (deleted after the new one was linked) and
    // its storage key was deleted from the provider.
    const oldMediaRow = await prisma.media.findUnique({
      where: { id: firstMediaId },
    });
    expect(oldMediaRow).toBeNull();
    expect(fakeProvider.deletedKeys).toEqual([firstMediaRow.storageKey]);
  });

  it('removeProfilePicture is a no-op when there is no existing picture', async () => {
    const customer = await seedCustomer();

    const result = await service.removeProfilePicture(customer.id);

    expect(result.pfpMediaId).toBeNull();
    expect(fakeProvider.deletedKeys).toHaveLength(0);
  });

  it('removeProfilePicture unlinks the FK before deleting the old media', async () => {
    const customer = await seedCustomer();
    const uploaded = await service.replaceProfilePicture(customer.id, {
      buffer: Buffer.from('a'),
      contentType: 'image/png',
      originalName: 'a.png',
      extension: 'png',
    });
    const mediaId = uploaded.customer.pfpMediaId as string;

    const result = await service.removeProfilePicture(customer.id);

    expect(result.pfpMediaId).toBeNull();
    const mediaRow = await prisma.media.findUnique({
      where: { id: mediaId },
    });
    expect(mediaRow).toBeNull();
    expect(fakeProvider.deletedKeys).toHaveLength(1);
  });

  describe('list', () => {
    it('paginates customers ordered by newest first', async () => {
      const suffix = randomUUID();
      const first = await seedCustomer({ name: `Alpha ${suffix}` });
      const second = await seedCustomer({ name: `Beta ${suffix}` });

      const result = await service.list({
        page: 1,
        pageSize: 1,
        search: suffix,
      });

      expect(result.total).toBe(2);
      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].id).toBe(second.id);

      const nextPage = await service.list({
        page: 2,
        pageSize: 1,
        search: suffix,
      });
      expect(nextPage.customers[0].id).toBe(first.id);
    });

    it('searches case-insensitively across name and email', async () => {
      const suffix = randomUUID();
      const customer = await seedCustomer({
        name: `Searchable Co ${suffix}`,
        email: `unique-${suffix}@example.com`,
      });

      const byName = await service.list({
        page: 1,
        pageSize: 20,
        search: `searchable co ${suffix}`,
      });
      expect(byName.customers.map((c) => c.id)).toContain(customer.id);

      const byEmail = await service.list({
        page: 1,
        pageSize: 20,
        search: `UNIQUE-${suffix}`,
      });
      expect(byEmail.customers.map((c) => c.id)).toContain(customer.id);
    });

    it('includes a null pfpUrl when no profile picture is set', async () => {
      const suffix = randomUUID();
      const customer = await seedCustomer({ name: `NoPfp ${suffix}` });

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: suffix,
      });

      const found = result.customers.find((c) => c.id === customer.id);
      expect(found?.pfpUrl).toBeNull();
    });

    it('includes the current plan id and name when the customer has one', async () => {
      const suffix = randomUUID();
      const plan = await seedPlan(`Plan With Customer ${suffix}`);
      const customer = await seedCustomer({ name: `HasPlan ${suffix}` });
      await prisma.customer.update({
        where: { id: customer.id },
        data: { currentPlanId: plan.id },
      });

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: suffix,
      });

      const found = result.customers.find((c) => c.id === customer.id);
      expect(found?.currentPlan).toEqual({ id: plan.id, name: plan.name });
    });

    it('returns a null currentPlan when the customer has no plan', async () => {
      const suffix = randomUUID();
      const customer = await seedCustomer({ name: `NoPlan ${suffix}` });

      const result = await service.list({
        page: 1,
        pageSize: 20,
        search: suffix,
      });

      const found = result.customers.find((c) => c.id === customer.id);
      expect(found?.currentPlan).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a customer account and leaves no orphaned session row', async () => {
      const email = `create-${randomUUID()}@example.com`;

      const created = await service.create({
        name: 'New Customer',
        email,
        password: 'a-strong-password',
      });
      seededAccountIds.push(
        (await prisma.customer.findUniqueOrThrow({ where: { id: created.id } }))
          .accountId,
      );

      expect(created.name).toBe('New Customer');
      expect(created.email).toBe(email);
      expect(created.banned).toBe(false);

      const account = await prisma.customerAccount.findUniqueOrThrow({
        where: { email },
      });
      const sessions = await prisma.customerSession.findMany({
        where: { userId: account.id },
      });
      expect(sessions).toHaveLength(0);
    });

    it('rejects a duplicate email', async () => {
      const email = `create-dup-${randomUUID()}@example.com`;
      const first = await service.create({
        name: 'First',
        email,
        password: 'a-strong-password',
      });
      seededAccountIds.push(
        (await prisma.customer.findUniqueOrThrow({ where: { id: first.id } }))
          .accountId,
      );

      await expect(
        service.create({
          name: 'Second',
          email,
          password: 'a-strong-password',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateForEmployee', () => {
    it('updates name and email independently', async () => {
      const customer = await seedCustomer();

      const nameOnly = await service.updateForEmployee(customer.id, {
        name: 'Renamed',
      });
      expect(nameOnly.name).toBe('Renamed');

      const newEmail = `updated-${randomUUID()}@example.com`;
      const emailOnly = await service.updateForEmployee(customer.id, {
        email: newEmail,
      });
      expect(emailOnly.email).toBe(newEmail);
      expect(emailOnly.name).toBe('Renamed');
    });

    it('rejects a duplicate email', async () => {
      const existing = await seedCustomer();
      const customer = await seedCustomer();
      const existingAccount = await prisma.customerAccount.findUniqueOrThrow({
        where: { id: existing.accountId },
      });

      await expect(
        service.updateForEmployee(customer.id, {
          email: existingAccount.email,
        }),
      ).rejects.toThrow('Email is already in use');
    });

    it('throws when the customer does not exist', async () => {
      await expect(
        service.updateForEmployee(randomUUID(), { name: 'X' }),
      ).rejects.toThrow();
    });
  });

  describe('setPasswordForEmployee', () => {
    it('creates a credential row when none exists yet, and it verifies', async () => {
      const customer = await seedCustomer();

      await service.setPasswordForEmployee(customer.id, {
        newPassword: 'brand-new-password',
      });

      const credential = await prisma.customerCredential.findFirstOrThrow({
        where: { userId: customer.accountId, providerId: 'credential' },
      });
      await expect(
        verifyCustomerPassword({
          hash: credential.password as string,
          password: 'brand-new-password',
        }),
      ).resolves.toBe(true);
    });

    it('updates an existing credential row in place', async () => {
      const email = `set-password-${randomUUID()}@example.com`;
      const created = await service.create({
        name: 'Has Password',
        email,
        password: 'original-password',
      });
      const customer = await prisma.customer.findUniqueOrThrow({
        where: { id: created.id },
      });
      seededAccountIds.push(customer.accountId);

      await service.setPasswordForEmployee(customer.id, {
        newPassword: 'replaced-password',
      });

      const credentials = await prisma.customerCredential.findMany({
        where: { userId: customer.accountId, providerId: 'credential' },
      });
      expect(credentials).toHaveLength(1);
      await expect(
        verifyCustomerPassword({
          hash: credentials[0].password as string,
          password: 'replaced-password',
        }),
      ).resolves.toBe(true);
    });

    it('throws when the customer does not exist', async () => {
      await expect(
        service.setPasswordForEmployee(randomUUID(), {
          newPassword: 'whatever-password',
        }),
      ).rejects.toThrow();
    });
  });

  describe('ban / unban', () => {
    it('bans a customer with a default reason and deletes existing sessions', async () => {
      const email = `ban-${randomUUID()}@example.com`;
      const created = await service.create({
        name: 'Ban Me',
        email,
        password: 'a-strong-password',
      });
      const customer = await prisma.customer.findUniqueOrThrow({
        where: { id: created.id },
      });
      seededAccountIds.push(customer.accountId);

      const signIn = await customerAuth.api.signInEmail({
        body: { email, password: 'a-strong-password' },
      });
      expect(signIn.token).toBeTruthy();

      const banned = await service.ban(customer.id, {});
      expect(banned.banned).toBe(true);
      expect(banned.banReason).toBe('No reason provided');

      const sessions = await prisma.customerSession.findMany({
        where: { userId: customer.accountId },
      });
      expect(sessions).toHaveLength(0);
    });

    it('uses a provided ban reason', async () => {
      const customer = await seedCustomer();

      const banned = await service.ban(customer.id, {
        banReason: 'Fraudulent activity',
      });

      expect(banned.banReason).toBe('Fraudulent activity');
    });

    it('unban clears ban fields, including for an already-unbanned customer', async () => {
      const customer = await seedCustomer();

      await service.ban(customer.id, { banReason: 'test' });
      const unbanned = await service.unban(customer.id);
      expect(unbanned.banned).toBe(false);
      expect(unbanned.banReason).toBeNull();

      await expect(service.unban(customer.id)).resolves.toMatchObject({
        banned: false,
      });
    });

    it('throws when the customer does not exist', async () => {
      await expect(service.ban(randomUUID(), {})).rejects.toThrow();
      await expect(service.unban(randomUUID())).rejects.toThrow();
    });
  });
});
