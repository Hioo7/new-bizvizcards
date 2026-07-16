import { randomUUID } from 'crypto';
import express from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import {
  CUSTOMER_AUTH,
  CUSTOMER_AUTH_BASE_PATH,
  EMPLOYEE_AUTH,
  EMPLOYEE_AUTH_BASE_PATH,
} from '../../src/common/auth/auth.constants';
import type { CustomerAuth } from '../../src/common/auth/customer-auth.factory';
import type { EmployeeAuth } from '../../src/common/auth/employee-auth.factory';
import { NodemailerOtpSender } from '../../src/common/auth/otp-sender/nodemailer-otp-sender.service';
import { EMPLOYEE_ROLE } from '../../src/common/constants/roles.constants';
import { BetterAuthApiErrorFilter } from '../../src/common/filters/better-auth-api-error.filter';
import {
  ECardComponentType,
  SmartCardTemplateKey,
} from '../../src/generated/prisma/client';
import type { CustomerModel } from '../../src/generated/prisma/models';

class FakeOtpSender {
  private lastOtpByEmail = new Map<string, string>();

  send({ email, otp }: { email: string; otp: string }): Promise<void> {
    this.lastOtpByEmail.set(email, otp);
    return Promise.resolve();
  }

  otpFor(email: string): string {
    const otp = this.lastOtpByEmail.get(email);
    if (!otp) throw new Error(`No OTP captured for ${email}`);
    return otp;
  }
}

describe('Business Events (e2e, TEST_DATABASE_URL only)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let fakeOtpSender: FakeOtpSender;
  let originalDatabaseUrl: string | undefined;
  const seededCustomerAccountIds: string[] = [];
  const seededEmployeeAccountIds: string[] = [];
  const seededEventIds: string[] = [];
  const seededEcardIds: string[] = [];
  const seededPlanIds: string[] = [];

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    fakeOtpSender = new FakeOtpSender();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NodemailerOtpSender)
      .useValue(fakeOtpSender)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });

    const employeeAuth = app.get<EmployeeAuth>(EMPLOYEE_AUTH);
    const customerAuth = app.get<CustomerAuth>(CUSTOMER_AUTH);
    const httpAdapter = app.getHttpAdapter().getInstance();
    httpAdapter.all(
      `${EMPLOYEE_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(employeeAuth),
    );
    httpAdapter.all(
      `${CUSTOMER_AUTH_BASE_PATH}/*splat`,
      toNodeHandler(customerAuth),
    );
    app.use(express.json());
    app.useGlobalFilters(new BetterAuthApiErrorFilter());

    await app.init();
    prisma = app.get(PrismaService);

    for (const key of Object.values(SmartCardTemplateKey)) {
      await prisma.smartCardTemplate.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }
  });

  afterAll(async () => {
    await app.close();
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  afterEach(async () => {
    if (seededEventIds.length > 0) {
      await prisma.businessEvent.deleteMany({
        where: { id: { in: seededEventIds } },
      });
      seededEventIds.length = 0;
    }
    if (seededEcardIds.length > 0) {
      await prisma.eCard.deleteMany({ where: { id: { in: seededEcardIds } } });
      seededEcardIds.length = 0;
    }
    if (seededCustomerAccountIds.length > 0) {
      await prisma.customerAccount.deleteMany({
        where: { id: { in: seededCustomerAccountIds } },
      });
      seededCustomerAccountIds.length = 0;
    }
    if (seededEmployeeAccountIds.length > 0) {
      await prisma.employeeAccount.deleteMany({
        where: { id: { in: seededEmployeeAccountIds } },
      });
      seededEmployeeAccountIds.length = 0;
    }
    if (seededPlanIds.length > 0) {
      await prisma.planPurchaseHistory.deleteMany({
        where: { planId: { in: seededPlanIds } },
      });
      await prisma.plan.deleteMany({ where: { id: { in: seededPlanIds } } });
      seededPlanIds.length = 0;
    }
  });

  async function seedEmployee(
    role: string = EMPLOYEE_ROLE.EMPLOYEE,
  ): Promise<{ accountId: string; employeeId: string; cookie: string }> {
    const email = `business-events-e2e-employee-${randomUUID()}@example.com`;
    const account = await prisma.employeeAccount.create({
      data: { name: 'Test Employee', email, emailVerified: true, role },
    });
    seededEmployeeAccountIds.push(account.id);
    const employee = await prisma.employee.create({
      data: { accountId: account.id },
    });

    await request(app.getHttpServer())
      .post(`${EMPLOYEE_AUTH_BASE_PATH}/email-otp/send-verification-otp`)
      .send({ email, type: 'sign-in' })
      .expect(200);
    const otp = fakeOtpSender.otpFor(email);
    const signInResponse = await request(app.getHttpServer())
      .post(`${EMPLOYEE_AUTH_BASE_PATH}/sign-in/email-otp`)
      .send({ email, otp })
      .expect(200);
    const setCookie = signInResponse.headers[
      'set-cookie'
    ] as unknown as string[];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    return { accountId: account.id, employeeId: employee.id, cookie };
  }

  async function seedCustomer(
    name = 'Test Customer',
  ): Promise<{ customer: CustomerModel; cookie: string }> {
    const email = `business-events-e2e-customer-${randomUUID()}@example.com`;
    const password = `Passw0rd-${randomUUID()}`;

    const signUpResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-up/email`)
      .send({ email, password, name })
      .expect(200);
    const accountId = (signUpResponse.body as { user: { id: string } }).user.id;
    seededCustomerAccountIds.push(accountId);

    const signInResponse = await request(app.getHttpServer())
      .post(`${CUSTOMER_AUTH_BASE_PATH}/sign-in/email`)
      .send({ email, password })
      .expect(200);
    const setCookie = signInResponse.headers[
      'set-cookie'
    ] as unknown as string[];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { accountId },
    });
    return { customer, cookie };
  }

  async function seedEcard(customerId: string) {
    const card = await prisma.eCard.create({
      data: {
        customerId,
        endpoint: `business-events-e2e-${randomUUID()}`,
        heroName: 'Test Hero',
        heroEmail: `business-events-e2e-hero-${randomUUID()}@example.com`,
      },
    });
    seededEcardIds.push(card.id);
    return card;
  }

  function permissiveEcardPolicyPayload() {
    return {
      isAvailable: true,
      maxEcards: 5,
      exchangeContactAccess: true,
      componentAvailabilities: Object.values(ECardComponentType).map(
        (type) => ({
          type,
          isAvailable: true,
          ...(type === ECardComponentType.GALLERY && {
            galleryLimits: {
              maxGalleries: 5,
              maxImagesPerGallery: 5,
              maxGallerySizeBytes: 1024 * 1024,
            },
          }),
        }),
      ),
    };
  }

  function permissiveSmartCardPolicyPayload() {
    return {
      isAvailable: true,
      maxSmartCards: 5,
      exchangeContactAccess: true,
      whitelistedTemplateIds: [],
    };
  }

  async function createEventPlanViaHttp(
    employeeCookie: string,
    maxGuestsPerEvent: number,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/employee/plans')
      .set('Cookie', employeeCookie)
      .send({
        name: `Event Test Plan ${randomUUID()}`,
        price: 0,
        businessModelType: 'ONE_TIME',
        isPublic: false,
        ecardPolicy: permissiveEcardPolicyPayload(),
        smartCardPolicy: permissiveSmartCardPolicyPayload(),
        organisationPolicy: {
          isAvailable: true,
          maxOrgsCanJoin: 5,
          maxOrgsCanCreate: 5,
          orgEcardPolicy: permissiveEcardPolicyPayload(),
          orgSmartCardPolicy: permissiveSmartCardPolicyPayload(),
        },
        eventPolicy: { isAvailable: true, maxEvents: 10, maxGuestsPerEvent },
      })
      .expect(201);
    const id = (response.body as { id: string }).id;
    seededPlanIds.push(id);
    return id;
  }

  async function assignPlan(
    employeeCookie: string,
    customerId: string,
    planId: string,
  ) {
    await request(app.getHttpServer())
      .post(`/api/employee/customers/${customerId}/plan/assign`)
      .set('Cookie', employeeCookie)
      .send({ planId })
      .expect(201);
  }

  it('full lifecycle: employee creates event, host adds co-host/volunteer, co-host bulk-adds guests, gate scan, trackable redemption, and every guard rejects correctly', async () => {
    const employee = await seedEmployee();
    const { customer: host, cookie: hostCookie } = await seedCustomer('Host');
    const { customer: coHostCustomer, cookie: coHostCookie } =
      await seedCustomer('Co-Host');
    const { customer: volunteerCustomer, cookie: volunteerCookie } =
      await seedCustomer('Volunteer');
    const { customer: guestCustomer } = await seedCustomer('Guest');
    const { customer: outsider } = await seedCustomer('Outsider');
    const { customer: anotherCustomer } = await seedCustomer('Another');

    // Employee creates the event on behalf of the host.
    const createResponse = await request(app.getHttpServer())
      .post('/api/employee/business-events')
      .set('Cookie', employee.cookie)
      .send({
        customerId: host.id,
        name: 'Annual Gala',
        startAt: new Date().toISOString(),
      })
      .expect(201);
    const event = createResponse.body as {
      id: string;
      hostCustomerId: string;
      createdByEmployeeId: string;
    };
    seededEventIds.push(event.id);
    expect(event.hostCustomerId).toBe(host.id);
    expect(event.createdByEmployeeId).toBe(employee.employeeId);

    // Host adds a co-host and a volunteer.
    const coHostMemberResponse = await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/members`)
      .set('Cookie', hostCookie)
      .send({ customerId: coHostCustomer.id, role: 'CO_HOST' })
      .expect(201);
    expect((coHostMemberResponse.body as { role: string }).role).toBe(
      'CO_HOST',
    );

    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/members`)
      .set('Cookie', hostCookie)
      .send({ customerId: volunteerCustomer.id, role: 'VOLUNTEER' })
      .expect(201);

    // A co-host cannot add another co-host.
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/members`)
      .set('Cookie', coHostCookie)
      .send({ customerId: anotherCustomer.id, role: 'CO_HOST' })
      .expect(403);

    // Co-host bulk-adds guests.
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/guests/bulk`)
      .set('Cookie', coHostCookie)
      .send({ customerIds: [guestCustomer.id] })
      .expect(201);

    const guestEcard = await seedEcard(guestCustomer.id);

    // Volunteer scans the guest in at the gate — success.
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/scan`)
      .set('Cookie', volunteerCookie)
      .send({ cardType: 'ECARD', endpoint: guestEcard.endpoint })
      .expect(201);

    // Repeat scan — already checked in.
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/scan`)
      .set('Cookie', volunteerCookie)
      .send({ cardType: 'ECARD', endpoint: guestEcard.endpoint })
      .expect(409);

    // A non-whitelisted customer's card is rejected at the gate.
    const outsiderEcard = await seedEcard(outsider.id);
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/scan`)
      .set('Cookie', volunteerCookie)
      .send({ cardType: 'ECARD', endpoint: outsiderEcard.endpoint })
      .expect(403);

    // Host creates a trackable.
    const trackableResponse = await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/trackables`)
      .set('Cookie', hostCookie)
      .send({ name: 'Food Coupon' })
      .expect(201);
    const trackable = trackableResponse.body as { id: string };

    // A second, never-gate-scanned guest can still redeem the trackable
    // (independent of check-in).
    const { customer: secondGuest } = await seedCustomer('Second Guest');
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/guests`)
      .set('Cookie', hostCookie)
      .send({ customerId: secondGuest.id })
      .expect(201);
    const secondGuestEcard = await seedEcard(secondGuest.id);

    await request(app.getHttpServer())
      .post(
        `/api/customer/business-events/${event.id}/trackables/${trackable.id}/scan`,
      )
      .set('Cookie', volunteerCookie)
      .send({ cardType: 'ECARD', endpoint: secondGuestEcard.endpoint })
      .expect(201);

    // Redeeming the same trackable again for the same guest is rejected.
    await request(app.getHttpServer())
      .post(
        `/api/customer/business-events/${event.id}/trackables/${trackable.id}/scan`,
      )
      .set('Cookie', volunteerCookie)
      .send({ cardType: 'ECARD', endpoint: secondGuestEcard.endpoint })
      .expect(409);
  });

  it('blocks bulk-adding a guest once the host is at their plan guest cap, and this stays unaffected by later plan downgrades on existing guests', async () => {
    const employee = await seedEmployee();
    const { customer: host, cookie: hostCookie } = await seedCustomer('Host');
    const planId = await createEventPlanViaHttp(employee.cookie, 1);
    await assignPlan(employee.cookie, host.id, planId);

    const createResponse = await request(app.getHttpServer())
      .post('/api/customer/business-events')
      .set('Cookie', hostCookie)
      .send({ name: 'Capped Event', startAt: new Date().toISOString() })
      .expect(201);
    const event = createResponse.body as { id: string };
    seededEventIds.push(event.id);

    const { customer: firstGuest } = await seedCustomer('First Guest');
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/guests`)
      .set('Cookie', hostCookie)
      .send({ customerId: firstGuest.id })
      .expect(201);

    const { customer: secondGuest } = await seedCustomer('Second Guest');
    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/guests`)
      .set('Cookie', hostCookie)
      .send({ customerId: secondGuest.id })
      .expect(409);

    // Downgrade the plan's guest cap further — the existing guest is
    // untouched (grandfathered).
    await request(app.getHttpServer())
      .patch(`/api/employee/plans/${planId}`)
      .set('Cookie', employee.cookie)
      .send({
        eventPolicy: { isAvailable: true, maxEvents: 10, maxGuestsPerEvent: 0 },
      })
      .expect(200);

    const guestsResponse = await request(app.getHttpServer())
      .get(`/api/employee/business-events/${event.id}/guests`)
      .set('Cookie', employee.cookie)
      .expect(200);
    const guests = guestsResponse.body as Array<{ customerId: string }>;
    expect(guests.some((g) => g.customerId === firstGuest.id)).toBe(true);
  });

  it('RBAC: every employee tier can list/manage events, only admin/super_admin can delete', async () => {
    const plainEmployee = await seedEmployee(EMPLOYEE_ROLE.EMPLOYEE);
    const admin = await seedEmployee(EMPLOYEE_ROLE.ADMIN);
    const { customer: host } = await seedCustomer('Host');

    const createResponse = await request(app.getHttpServer())
      .post('/api/employee/business-events')
      .set('Cookie', plainEmployee.cookie)
      .send({
        customerId: host.id,
        name: 'RBAC Event',
        startAt: new Date().toISOString(),
      })
      .expect(201);
    const event = createResponse.body as { id: string };
    seededEventIds.push(event.id);

    await request(app.getHttpServer())
      .get('/api/employee/business-events')
      .set('Cookie', plainEmployee.cookie)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/employee/business-events/${event.id}`)
      .set('Cookie', plainEmployee.cookie)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/employee/business-events/${event.id}`)
      .set('Cookie', admin.cookie)
      .expect(200);
    seededEventIds.splice(seededEventIds.indexOf(event.id), 1);
  });

  it('chained trackables: a dependent trackable can only be redeemed after its dependency has been', async () => {
    const { cookie: hostCookie } = await seedCustomer('Host');
    const { customer: guestCustomer } = await seedCustomer('Guest');

    const createResponse = await request(app.getHttpServer())
      .post('/api/customer/business-events')
      .set('Cookie', hostCookie)
      .send({
        name: 'Chained Trackables Event',
        startAt: new Date().toISOString(),
      })
      .expect(201);
    const event = createResponse.body as { id: string };
    seededEventIds.push(event.id);

    await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/guests`)
      .set('Cookie', hostCookie)
      .send({ customerId: guestCustomer.id })
      .expect(201);
    const guestEcard = await seedEcard(guestCustomer.id);

    const mainGateResponse = await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/trackables`)
      .set('Cookie', hostCookie)
      .send({ name: 'Main Gate Entrance' })
      .expect(201);
    const mainGate = mainGateResponse.body as { id: string };

    const foodCouponResponse = await request(app.getHttpServer())
      .post(`/api/customer/business-events/${event.id}/trackables`)
      .set('Cookie', hostCookie)
      .send({ name: 'Food Coupon', dependsOnTrackableIds: [mainGate.id] })
      .expect(201);
    const foodCoupon = foodCouponResponse.body as {
      id: string;
      dependencies: Array<{ id: string; name: string }>;
    };
    expect(foodCoupon.dependencies).toEqual([
      { id: mainGate.id, name: 'Main Gate Entrance' },
    ]);

    // Trying the food coupon before the main gate is scanned is rejected.
    await request(app.getHttpServer())
      .post(
        `/api/customer/business-events/${event.id}/trackables/${foodCoupon.id}/scan`,
      )
      .set('Cookie', hostCookie)
      .send({ cardType: 'ECARD', endpoint: guestEcard.endpoint })
      .expect(403);

    // Redeem the main gate trackable first.
    await request(app.getHttpServer())
      .post(
        `/api/customer/business-events/${event.id}/trackables/${mainGate.id}/scan`,
      )
      .set('Cookie', hostCookie)
      .send({ cardType: 'ECARD', endpoint: guestEcard.endpoint })
      .expect(201);

    // Now the food coupon succeeds.
    await request(app.getHttpServer())
      .post(
        `/api/customer/business-events/${event.id}/trackables/${foodCoupon.id}/scan`,
      )
      .set('Cookie', hostCookie)
      .send({ cardType: 'ECARD', endpoint: guestEcard.endpoint })
      .expect(201);

    // Making the main gate depend on the food coupon now would be circular.
    await request(app.getHttpServer())
      .patch(
        `/api/customer/business-events/${event.id}/trackables/${mainGate.id}`,
      )
      .set('Cookie', hostCookie)
      .send({ dependsOnTrackableIds: [foodCoupon.id] })
      .expect(409);
  });
});
