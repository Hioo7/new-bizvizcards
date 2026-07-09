import type { Response } from 'express';
import { PublicSmartCardsController } from './public-smart-cards.controller';
import type { SmartCardsService } from './services/smart-cards.service';
import type { SmartCardVCardService } from './services/smart-card-vcard.service';

function makeResponse() {
  const setHeader = jest.fn();
  const send = jest.fn();
  const res = { setHeader, send } as unknown as Response;
  return { res, setHeader, send };
}

describe('PublicSmartCardsController', () => {
  it('get forwards the endpoint to the service', async () => {
    const getByEndpoint = jest.fn().mockResolvedValue({ id: 'card-1' });
    const controller = new PublicSmartCardsController(
      { getByEndpoint } as unknown as SmartCardsService,
      {} as unknown as SmartCardVCardService,
    );

    await controller.get('my-card');

    expect(getByEndpoint).toHaveBeenCalledWith('my-card');
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
