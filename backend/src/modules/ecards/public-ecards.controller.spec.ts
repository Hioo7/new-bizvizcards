import type { Response } from 'express';
import { PublicEcardsController } from './public-ecards.controller';
import type { EcardsService } from './services/ecards.service';
import type { EcardVCardService } from './services/ecard-vcard.service';
import type { EcardOgPreviewService } from './services/ecard-og-preview.service';
import { ECardEventType } from '../../generated/prisma/client';
import type { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import type { LeadsService } from '../leads/services/leads.service';
import type { PlanPolicyResolverService } from '../plans/services/plan-policy-resolver.service';

function makeAvailablePolicyResolver() {
  return {
    getEffectiveEcardPolicyForCard: jest.fn().mockResolvedValue({
      isAvailable: true,
      exchangeContactAccess: true,
      components: {},
    }),
  } as unknown as PlanPolicyResolverService;
}

function makeResponse() {
  const setHeader = jest.fn();
  const send = jest.fn();
  const res = { setHeader, send } as unknown as Response;
  return { res, setHeader, send };
}

describe('PublicEcardsController', () => {
  it('get forwards the endpoint to the service, records a VIEW event, and returns the card with the view event id', async () => {
    const card = {
      id: 'card-1',
      customerId: 'customer-1',
      organisationId: null,
      components: [],
    };
    const getByEndpoint = jest.fn().mockResolvedValue(card);
    const recordEvent = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = new PublicEcardsController(
      { getByEndpoint } as unknown as EcardsService,
      {} as unknown as EcardVCardService,
      {} as unknown as EcardOgPreviewService,
      { recordEvent } as unknown as EcardAnalyticsService,
      {} as unknown as LeadsService,
      makeAvailablePolicyResolver(),
    );

    const result = await controller.get('my-card');

    expect(getByEndpoint).toHaveBeenCalledWith('my-card');
    expect(recordEvent).toHaveBeenCalledWith('card-1', ECardEventType.VIEW);
    expect(result).toEqual({
      card,
      viewEventId: 'event-1',
      exchangeContactAllowed: true,
    });
  });

  it('get 404s when the effective policy makes the e-card unavailable', async () => {
    const card = {
      id: 'card-1',
      customerId: 'customer-1',
      organisationId: null,
      components: [],
    };
    const getByEndpoint = jest.fn().mockResolvedValue(card);
    const getEffectiveEcardPolicyForCard = jest
      .fn()
      .mockResolvedValue({ isAvailable: false, components: {} });
    const controller = new PublicEcardsController(
      { getByEndpoint } as unknown as EcardsService,
      {} as unknown as EcardVCardService,
      {} as unknown as EcardOgPreviewService,
      {} as unknown as EcardAnalyticsService,
      {} as unknown as LeadsService,
      {
        getEffectiveEcardPolicyForCard,
      } as unknown as PlanPolicyResolverService,
    );

    await expect(controller.get('my-card')).rejects.toThrow('E-card not found');
  });

  describe('recordViewDuration', () => {
    it('resolves the card by endpoint and forwards the event id and duration to the analytics service', async () => {
      const getByEndpoint = jest.fn().mockResolvedValue({ id: 'card-1' });
      const recordViewDuration = jest.fn().mockResolvedValue(undefined);
      const controller = new PublicEcardsController(
        { getByEndpoint } as unknown as EcardsService,
        {} as unknown as EcardVCardService,
        {} as unknown as EcardOgPreviewService,
        { recordViewDuration } as unknown as EcardAnalyticsService,
        {} as unknown as LeadsService,
        {} as unknown as PlanPolicyResolverService,
      );

      await controller.recordViewDuration('my-card', 'event-1', {
        durationMs: 4200,
      });

      expect(getByEndpoint).toHaveBeenCalledWith('my-card');
      expect(recordViewDuration).toHaveBeenCalledWith(
        'card-1',
        'event-1',
        4200,
      );
    });
  });

  it('exchangeContact forwards the endpoint and payload to the leads service and records an EXCHANGE_CONTACT event', async () => {
    const lead = { id: 'lead-1' };
    const createFromEcardExchangeContact = jest.fn().mockResolvedValue(lead);
    const getByEndpoint = jest.fn().mockResolvedValue({ id: 'card-1' });
    const recordEvent = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = new PublicEcardsController(
      { getByEndpoint } as unknown as EcardsService,
      {} as unknown as EcardVCardService,
      {} as unknown as EcardOgPreviewService,
      { recordEvent } as unknown as EcardAnalyticsService,
      { createFromEcardExchangeContact } as unknown as LeadsService,
      {} as unknown as PlanPolicyResolverService,
    );
    const dto = { name: 'Jane', phoneNumber: '5551234567' } as never;

    const result = await controller.exchangeContact('my-card', dto);

    expect(createFromEcardExchangeContact).toHaveBeenCalledWith('my-card', dto);
    expect(getByEndpoint).toHaveBeenCalledWith('my-card');
    expect(recordEvent).toHaveBeenCalledWith(
      'card-1',
      ECardEventType.EXCHANGE_CONTACT,
    );
    expect(result).toBe(lead);
  });

  it('vcard builds the text from the assembled card, sends it inline, and records a CONTACT_SAVE event', async () => {
    const card = {
      id: 'card-1',
      hero: {
        name: 'Jane',
        email: 'jane@acme.test',
        companyName: 'Acme',
        phoneCountryDialCode: '1',
        phoneNumber: '5551234567',
      },
    };
    const getByEndpoint = jest.fn().mockResolvedValue(card);
    const buildVCardText = jest.fn().mockReturnValue('BEGIN:VCARD...');
    const recordEvent = jest.fn().mockResolvedValue({ id: 'event-1' });
    const controller = new PublicEcardsController(
      { getByEndpoint } as unknown as EcardsService,
      { buildVCardText } as unknown as EcardVCardService,
      {} as unknown as EcardOgPreviewService,
      { recordEvent } as unknown as EcardAnalyticsService,
      {} as unknown as LeadsService,
      {} as unknown as PlanPolicyResolverService,
    );
    const { res, setHeader, send } = makeResponse();

    await controller.vcard('my-card', res);

    expect(buildVCardText).toHaveBeenCalledWith({
      name: 'Jane',
      email: 'jane@acme.test',
      companyName: 'Acme',
      phoneCountryDialCode: '1',
      phoneNumber: '5551234567',
    });
    expect(recordEvent).toHaveBeenCalledWith(
      'card-1',
      ECardEventType.CONTACT_SAVE,
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/vcard; charset=utf-8',
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'inline; filename="my-card.vcf"',
    );
    expect(send).toHaveBeenCalledWith('BEGIN:VCARD...');
  });

  it('preview builds OG fields from the assembled card and sends the rendered HTML', async () => {
    const card = { hero: { name: 'Jane', companyName: 'Acme' } };
    const fields = { title: 'Jane', description: 'Acme', imageUrl: null };
    const getByEndpoint = jest.fn().mockResolvedValue(card);
    const buildFields = jest.fn().mockReturnValue(fields);
    const renderHtml = jest.fn().mockReturnValue('<html></html>');
    const controller = new PublicEcardsController(
      { getByEndpoint } as unknown as EcardsService,
      {} as unknown as EcardVCardService,
      { buildFields, renderHtml } as unknown as EcardOgPreviewService,
      {} as unknown as EcardAnalyticsService,
      {} as unknown as LeadsService,
      {} as unknown as PlanPolicyResolverService,
    );
    const { res, setHeader, send } = makeResponse();

    await controller.preview('my-card', res);

    expect(getByEndpoint).toHaveBeenCalledWith('my-card');
    expect(buildFields).toHaveBeenCalledWith(card);
    expect(renderHtml).toHaveBeenCalledWith('my-card', fields);
    expect(setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/html; charset=utf-8',
    );
    expect(send).toHaveBeenCalledWith('<html></html>');
  });
});
