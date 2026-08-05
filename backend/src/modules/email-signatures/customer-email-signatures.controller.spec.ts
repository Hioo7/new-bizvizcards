import { NotFoundException } from '@nestjs/common';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { CustomerEmailSignaturesController } from './customer-email-signatures.controller';
import type { EmailSignaturesService } from './services/email-signatures.service';

function makeRequest(accountId = 'account-1'): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

// Checklist: listMine/getMine/create/update/remove resolve the caller and
// delegate correctly; getMine/update/remove throw NotFoundException (not
// leaking the service call) for a signature owned by a different customer;
// preview delegates directly with no ownership check (it isn't tied to an
// existing resource).
describe('CustomerEmailSignaturesController', () => {
  describe('listMine', () => {
    it('resolves the caller and lists their own signatures', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const listForCustomer = jest
        .fn()
        .mockResolvedValue([{ id: 'signature-1' }]);
      const controller = new CustomerEmailSignaturesController(
        { listForCustomer } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.listMine(makeRequest());

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(listForCustomer).toHaveBeenCalledWith('customer-1');
      expect(result).toEqual([{ id: 'signature-1' }]);
    });
  });

  describe('getMine', () => {
    it("returns the caller's own signature", async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'signature-1', customerId: 'customer-1' });
      const controller = new CustomerEmailSignaturesController(
        { getById } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.getMine(makeRequest(), 'signature-1');

      expect(result).toEqual({ id: 'signature-1', customerId: 'customer-1' });
    });

    it('throws NotFoundException when the signature belongs to a different customer', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'signature-1', customerId: 'someone-else' });
      const controller = new CustomerEmailSignaturesController(
        { getById } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.getMine(makeRequest(), 'signature-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('resolves the caller, parses the multipart JSON payload, and delegates with their own customerId injected', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const create = jest.fn().mockResolvedValue({ id: 'signature-1' });
      const controller = new CustomerEmailSignaturesController(
        { create } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );
      const rawData = JSON.stringify({
        name: 'Work Signature',
        templateKey: 'MINIMAL',
        fullName: 'Jane Doe',
        socialLinks: [],
      });

      const result = await controller.create(makeRequest(), [], rawData);

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jane Doe',
          customerId: 'customer-1',
        }),
        [],
      );
      expect(result).toEqual({ id: 'signature-1' });
    });
  });

  describe('update', () => {
    it('checks ownership then delegates to update', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'signature-1', customerId: 'customer-1' });
      const update = jest.fn().mockResolvedValue({ id: 'signature-1' });
      const controller = new CustomerEmailSignaturesController(
        { getById, update } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );
      const rawData = JSON.stringify({ fullName: 'Jane Smith' });

      const result = await controller.update(
        makeRequest(),
        'signature-1',
        [],
        rawData,
      );

      expect(update).toHaveBeenCalledWith(
        'signature-1',
        expect.objectContaining({ fullName: 'Jane Smith' }),
        [],
      );
      expect(result).toEqual({ id: 'signature-1' });
    });

    it('throws NotFoundException and never calls update for a foreign signature', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'signature-1', customerId: 'someone-else' });
      const update = jest.fn();
      const controller = new CustomerEmailSignaturesController(
        { getById, update } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.update(
          makeRequest(),
          'signature-1',
          [],
          JSON.stringify({ fullName: 'Jane Smith' }),
        ),
      ).rejects.toThrow(NotFoundException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('checks ownership then delegates to delete', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'signature-1', customerId: 'customer-1' });
      const deleteFn = jest.fn().mockResolvedValue(undefined);
      const controller = new CustomerEmailSignaturesController(
        { getById, delete: deleteFn } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );

      await controller.remove(makeRequest(), 'signature-1');

      expect(deleteFn).toHaveBeenCalledWith('signature-1');
    });

    it('throws NotFoundException and never calls delete for a foreign signature', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'signature-1', customerId: 'someone-else' });
      const deleteFn = jest.fn();
      const controller = new CustomerEmailSignaturesController(
        { getById, delete: deleteFn } as unknown as EmailSignaturesService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.remove(makeRequest(), 'signature-1'),
      ).rejects.toThrow(NotFoundException);
      expect(deleteFn).not.toHaveBeenCalled();
    });
  });

  describe('preview', () => {
    it('delegates directly to renderPreview with no ownership check', () => {
      const renderPreview = jest
        .fn()
        .mockReturnValue({ html: '<table></table>' });
      const controller = new CustomerEmailSignaturesController(
        { renderPreview } as unknown as EmailSignaturesService,
        {} as unknown as CustomersService,
      );

      const result = controller.preview({
        templateKey: 'MINIMAL',
        fullName: 'Preview Person',
        socialLinks: [],
      });

      expect(renderPreview).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Preview Person' }),
      );
      expect(result).toEqual({ html: '<table></table>' });
    });
  });
});
