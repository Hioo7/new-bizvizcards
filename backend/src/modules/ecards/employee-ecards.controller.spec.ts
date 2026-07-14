import type { Response } from 'express';
import { EmployeeEcardsController } from './employee-ecards.controller';
import type { EcardsService } from './services/ecards.service';
import type { EcardGoogleWalletService } from './services/ecard-google-wallet.service';
import type { EcardAppleWalletService } from './services/ecard-apple-wallet.service';
import { ECardEventType } from '../../generated/prisma/client';
import type { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';

function makeResponse() {
  const setHeader = jest.fn();
  const send = jest.fn();
  const res = { setHeader, send } as unknown as Response;
  return { res, setHeader, send };
}

describe('EmployeeEcardsController', () => {
  describe('getAnalytics', () => {
    it('returns the analytics summary for the given ecard id', async () => {
      const getSummary = jest.fn().mockResolvedValue({
        totalViews: 5,
        totalWalletSaves: 2,
        dailyCounts: [],
      });
      const controller = new EmployeeEcardsController(
        {} as unknown as EcardsService,
        { getSummary } as unknown as EcardAnalyticsService,
        {} as unknown as EcardGoogleWalletService,
        {} as unknown as EcardAppleWalletService,
      );

      const result = await controller.getAnalytics('ecard-1', {});

      expect(getSummary).toHaveBeenCalledWith('ecard-1', {});
      expect(result).toEqual({
        totalViews: 5,
        totalWalletSaves: 2,
        dailyCounts: [],
      });
    });
  });

  describe('googleWallet', () => {
    it('builds a save URL for the given ecard id and records a WALLET_SAVE event', async () => {
      const getById = jest.fn().mockResolvedValue({ id: 'ecard-1' });
      const buildSaveUrl = jest
        .fn()
        .mockResolvedValue('https://pay.google.com/gp/v/save/token');
      const recordEvent = jest.fn().mockResolvedValue(undefined);
      const controller = new EmployeeEcardsController(
        { getById } as unknown as EcardsService,
        { recordEvent } as unknown as EcardAnalyticsService,
        { buildSaveUrl } as unknown as EcardGoogleWalletService,
        {} as unknown as EcardAppleWalletService,
      );

      const result = await controller.googleWallet('ecard-1');

      expect(getById).toHaveBeenCalledWith('ecard-1');
      expect(buildSaveUrl).toHaveBeenCalledWith({ id: 'ecard-1' });
      expect(recordEvent).toHaveBeenCalledWith(
        'ecard-1',
        ECardEventType.WALLET_SAVE,
      );
      expect(result).toEqual({ url: 'https://pay.google.com/gp/v/save/token' });
    });
  });

  describe('appleWallet', () => {
    it('builds a .pkpass for the given ecard id, records a WALLET_SAVE event, and streams it', async () => {
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1', endpoint: 'jane-doe' });
      const buffer = Buffer.from('pkpass-bytes');
      const buildPass = jest.fn().mockReturnValue(buffer);
      const recordEvent = jest.fn().mockResolvedValue(undefined);
      const controller = new EmployeeEcardsController(
        { getById } as unknown as EcardsService,
        { recordEvent } as unknown as EcardAnalyticsService,
        {} as unknown as EcardGoogleWalletService,
        { buildPass } as unknown as EcardAppleWalletService,
      );
      const { res, setHeader, send } = makeResponse();

      await controller.appleWallet('ecard-1', res);

      expect(getById).toHaveBeenCalledWith('ecard-1');
      expect(buildPass).toHaveBeenCalledWith({
        id: 'ecard-1',
        endpoint: 'jane-doe',
      });
      expect(recordEvent).toHaveBeenCalledWith(
        'ecard-1',
        ECardEventType.WALLET_SAVE,
      );
      expect(setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.apple.pkpass',
      );
      expect(setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="jane-doe.pkpass"',
      );
      expect(send).toHaveBeenCalledWith(buffer);
    });
  });
});
