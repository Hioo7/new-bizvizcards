import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { EcardsController } from './ecards.controller';
import type { EcardsService } from './services/ecards.service';
import type { EcardGoogleWalletService } from './services/ecard-google-wallet.service';
import type { EcardAppleWalletService } from './services/ecard-apple-wallet.service';
import type { CustomersService } from '../customers/services/customers.service';
import { ECardEventType } from '../../generated/prisma/client';
import type { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';

function makeRequest(accountId = 'account-1'): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

function makeResponse() {
  const setHeader = jest.fn();
  const send = jest.fn();
  const res = { setHeader, send } as unknown as Response;
  return { res, setHeader, send };
}

describe('EcardsController', () => {
  describe('getMineAnalytics', () => {
    it("resolves the caller's own ecard and returns its analytics summary", async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1', customerId: 'customer-1' });
      const getSummary = jest.fn().mockResolvedValue({
        totalViews: 3,
        totalWalletSaves: 1,
        dailyCounts: [],
      });
      const controller = new EcardsController(
        { getById } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        { getSummary } as unknown as EcardAnalyticsService,
        {} as unknown as EcardGoogleWalletService,
        {} as unknown as EcardAppleWalletService,
      );

      const result = await controller.getMineAnalytics(
        makeRequest(),
        'ecard-1',
        {},
      );

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(getById).toHaveBeenCalledWith('ecard-1');
      expect(getSummary).toHaveBeenCalledWith('ecard-1', {});
      expect(result).toEqual({
        totalViews: 3,
        totalWalletSaves: 1,
        dailyCounts: [],
      });
    });

    it('throws NotFoundException when the ecard belongs to a different customer', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1', customerId: 'someone-else' });
      const getSummary = jest.fn();
      const controller = new EcardsController(
        { getById } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        { getSummary } as unknown as EcardAnalyticsService,
        {} as unknown as EcardGoogleWalletService,
        {} as unknown as EcardAppleWalletService,
      );

      await expect(
        controller.getMineAnalytics(makeRequest(), 'ecard-1', {}),
      ).rejects.toThrow(NotFoundException);
      expect(getSummary).not.toHaveBeenCalled();
    });
  });

  describe('googleWalletMine', () => {
    it("builds a save URL for the caller's own ecard and records a WALLET_SAVE event", async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1', customerId: 'customer-1' });
      const buildSaveUrl = jest
        .fn()
        .mockResolvedValue('https://pay.google.com/gp/v/save/token');
      const recordEvent = jest.fn().mockResolvedValue(undefined);
      const controller = new EcardsController(
        { getById } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        { recordEvent } as unknown as EcardAnalyticsService,
        { buildSaveUrl } as unknown as EcardGoogleWalletService,
        {} as unknown as EcardAppleWalletService,
      );

      const result = await controller.googleWalletMine(
        makeRequest(),
        'ecard-1',
      );

      expect(getById).toHaveBeenCalledWith('ecard-1');
      expect(buildSaveUrl).toHaveBeenCalledWith({
        id: 'ecard-1',
        customerId: 'customer-1',
      });
      expect(recordEvent).toHaveBeenCalledWith(
        'ecard-1',
        ECardEventType.WALLET_SAVE,
      );
      expect(result).toEqual({ url: 'https://pay.google.com/gp/v/save/token' });
    });

    it('throws NotFoundException when the ecard belongs to a different customer', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1', customerId: 'someone-else' });
      const buildSaveUrl = jest.fn();
      const controller = new EcardsController(
        { getById } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        {} as unknown as EcardAnalyticsService,
        { buildSaveUrl } as unknown as EcardGoogleWalletService,
        {} as unknown as EcardAppleWalletService,
      );

      await expect(
        controller.googleWalletMine(makeRequest(), 'ecard-1'),
      ).rejects.toThrow(NotFoundException);
      expect(buildSaveUrl).not.toHaveBeenCalled();
    });
  });

  describe('appleWalletMine', () => {
    it("builds a .pkpass for the caller's own ecard, records a WALLET_SAVE event, and streams it", async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest.fn().mockResolvedValue({
        id: 'ecard-1',
        customerId: 'customer-1',
        endpoint: 'jane-doe',
      });
      const buffer = Buffer.from('pkpass-bytes');
      const buildPass = jest.fn().mockReturnValue(buffer);
      const recordEvent = jest.fn().mockResolvedValue(undefined);
      const controller = new EcardsController(
        { getById } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        { recordEvent } as unknown as EcardAnalyticsService,
        {} as unknown as EcardGoogleWalletService,
        { buildPass } as unknown as EcardAppleWalletService,
      );
      const { res, setHeader, send } = makeResponse();

      await controller.appleWalletMine(makeRequest(), 'ecard-1', res);

      expect(getById).toHaveBeenCalledWith('ecard-1');
      expect(buildPass).toHaveBeenCalledWith({
        id: 'ecard-1',
        customerId: 'customer-1',
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

    it('throws NotFoundException when the ecard belongs to a different customer', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'ecard-1', customerId: 'someone-else' });
      const buildPass = jest.fn();
      const controller = new EcardsController(
        { getById } as unknown as EcardsService,
        { getByAccountId } as unknown as CustomersService,
        {} as unknown as EcardAnalyticsService,
        {} as unknown as EcardGoogleWalletService,
        { buildPass } as unknown as EcardAppleWalletService,
      );
      const { res } = makeResponse();

      await expect(
        controller.appleWalletMine(makeRequest(), 'ecard-1', res),
      ).rejects.toThrow(NotFoundException);
      expect(buildPass).not.toHaveBeenCalled();
    });
  });
});
