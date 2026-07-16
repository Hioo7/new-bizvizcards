import type { Response } from 'express';
import { PublicSmartCardsController } from './public-smart-cards.controller';
import type { SmartCardsService } from './services/smart-cards.service';
import type { SmartCardVCardService } from './services/smart-card-vcard.service';
import type { SmartCardOgPreviewService } from './services/smart-card-og-preview.service';
import type { LeadsService } from '../leads/services/leads.service';
import type { PlanPolicyResolverService } from '../plans/services/plan-policy-resolver.service';

function makeResponse() {
  const setHeader = jest.fn();
  const send = jest.fn();
  const res = { setHeader, send } as unknown as Response;
  return { res, setHeader, send };
}

describe('PublicSmartCardsController', () => {
  it('get forwards the endpoint to the service and is exempt from plan enforcement when unclaimed', async () => {
    const getByEndpoint = jest
      .fn()
      .mockResolvedValue({ id: 'card-1', customerId: null });
    const controller = new PublicSmartCardsController(
      { getByEndpoint } as unknown as SmartCardsService,
      {} as unknown as SmartCardVCardService,
      {} as unknown as SmartCardOgPreviewService,
      {} as unknown as LeadsService,
      {} as unknown as PlanPolicyResolverService,
    );

    const result = await controller.get('my-card');

    expect(getByEndpoint).toHaveBeenCalledWith('my-card');
    expect(result).toEqual({
      id: 'card-1',
      customerId: null,
      exchangeContactAllowed: true,
    });
  });

  it('get includes exchangeContactAllowed resolved from the claimed customer effective policy', async () => {
    const getByEndpoint = jest
      .fn()
      .mockResolvedValue({ id: 'card-1', customerId: 'customer-1' });
    const getEffectiveSmartCardPolicy = jest
      .fn()
      .mockResolvedValue({ isAvailable: true, exchangeContactAccess: false });
    const controller = new PublicSmartCardsController(
      { getByEndpoint } as unknown as SmartCardsService,
      {} as unknown as SmartCardVCardService,
      {} as unknown as SmartCardOgPreviewService,
      {} as unknown as LeadsService,
      { getEffectiveSmartCardPolicy } as unknown as PlanPolicyResolverService,
    );

    const result = await controller.get('my-card');

    expect(result).toEqual({
      id: 'card-1',
      customerId: 'customer-1',
      exchangeContactAllowed: false,
    });
  });

  it('get 404s when the claimed customer effective smart-card policy is unavailable', async () => {
    const getByEndpoint = jest
      .fn()
      .mockResolvedValue({ id: 'card-1', customerId: 'customer-1' });
    const getEffectiveSmartCardPolicy = jest
      .fn()
      .mockResolvedValue({ isAvailable: false });
    const controller = new PublicSmartCardsController(
      { getByEndpoint } as unknown as SmartCardsService,
      {} as unknown as SmartCardVCardService,
      {} as unknown as SmartCardOgPreviewService,
      {} as unknown as LeadsService,
      { getEffectiveSmartCardPolicy } as unknown as PlanPolicyResolverService,
    );

    await expect(controller.get('my-card')).rejects.toThrow(
      'Smart card not found',
    );
  });

  it('vcard builds the text from the assembled card and sends it inline', async () => {
    const card = {
      profile: { companyName: 'Acme' },
      founder: { name: 'Jane' },
      contact: {
        contactNumber: '123',
        email: 'jane@acme.test',
        address: 'Addr',
      },
      socialMedia: { website: 'https://acme.test' },
    };
    const getByEndpoint = jest.fn().mockResolvedValue(card);
    const buildVCardText = jest.fn().mockReturnValue('BEGIN:VCARD...');
    const controller = new PublicSmartCardsController(
      { getByEndpoint } as unknown as SmartCardsService,
      { buildVCardText } as unknown as SmartCardVCardService,
      {} as unknown as SmartCardOgPreviewService,
      {} as unknown as LeadsService,
      {} as unknown as PlanPolicyResolverService,
    );
    const { res, setHeader, send } = makeResponse();

    await controller.vcard('my-card', res);

    expect(buildVCardText).toHaveBeenCalledWith({
      companyName: 'Acme',
      founderName: 'Jane',
      contactNumber: '123',
      email: 'jane@acme.test',
      address: 'Addr',
      website: 'https://acme.test',
    });
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
});
