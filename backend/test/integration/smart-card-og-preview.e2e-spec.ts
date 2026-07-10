import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { SmartCardTemplateKey } from '../../src/generated/prisma/client';

describe('Smart card Open Graph preview (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalDatabaseUrl: string | undefined;
  const seededCardIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    app.use(express.json());

    await app.init();
    prisma = app.get(PrismaService);

    await prisma.smartCardTemplate.upsert({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
      update: {},
      create: {
        key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
        name: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE,
      },
    });
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededCardIds.length > 0) {
      await prisma.smartCard.deleteMany({
        where: { id: { in: seededCardIds } },
      });
      seededCardIds.length = 0;
    }
  });

  async function seedCard(
    endpointSuffix: string,
    profile?: { companyName?: string; tagline?: string },
  ) {
    const template = await prisma.smartCardTemplate.findUniqueOrThrow({
      where: { key: SmartCardTemplateKey.INTERIOR_DESIGN_TEMPLATE },
    });
    const card = await prisma.smartCard.create({
      data: {
        templateId: template.id,
        endpoint: `og-preview-e2e-${endpointSuffix}-${randomUUID()}`,
        ...(profile && { profile: { create: profile } }),
      },
    });
    seededCardIds.push(card.id);
    return card;
  }

  it('returns HTML with correct og:title/og:description for a card with profile data', async () => {
    const card = await seedCard('happy', {
      companyName: 'Acme Interiors',
      tagline: 'Beautiful spaces, built right',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/public/smart-cards/${card.endpoint}/preview`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain(
      '<meta property="og:title" content="Acme Interiors" />',
    );
    expect(response.text).toContain(
      '<meta property="og:description" content="Beautiful spaces, built right" />',
    );
    expect(response.text).toContain(`/smartcard/${card.endpoint}`);
  });

  it('falls back to generic title/description and the default image when there is no profile', async () => {
    const card = await seedCard('no-profile');

    const response = await request(app.getHttpServer())
      .get(`/api/public/smart-cards/${card.endpoint}/preview`)
      .expect(200);

    expect(response.text).toContain(
      '<meta property="og:title" content="Business Card" />',
    );
    expect(response.text).toContain('og:image');
    expect(response.text).toContain('defaults/og-preview-fallback.png');
  });

  it('returns 404 when the endpoint does not exist', async () => {
    await request(app.getHttpServer())
      .get('/api/public/smart-cards/does-not-exist/preview')
      .expect(404);
  });
});
