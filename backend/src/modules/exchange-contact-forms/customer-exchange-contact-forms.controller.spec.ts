import { NotFoundException } from '@nestjs/common';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import type { CustomersService } from '../customers/services/customers.service';
import { CustomerExchangeContactFormsController } from './customer-exchange-contact-forms.controller';
import type { ExchangeContactFormsService } from './services/exchange-contact-forms.service';

function makeRequest(accountId = 'account-1'): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

describe('CustomerExchangeContactFormsController', () => {
  describe('listMine', () => {
    it('resolves the caller and lists their own forms', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const listForCustomer = jest.fn().mockResolvedValue([{ id: 'form-1' }]);
      const controller = new CustomerExchangeContactFormsController(
        { listForCustomer } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.listMine(makeRequest());

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(listForCustomer).toHaveBeenCalledWith('customer-1');
      expect(result).toEqual([{ id: 'form-1' }]);
    });
  });

  describe('create', () => {
    it('resolves the caller and delegates to create with their own customerId injected', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const create = jest.fn().mockResolvedValue({ id: 'form-1' });
      const controller = new CustomerExchangeContactFormsController(
        { create } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.create(makeRequest(), {
        name: 'My form',
        fields: [],
      });

      expect(getByAccountId).toHaveBeenCalledWith('account-1');
      expect(create).toHaveBeenCalledWith({
        name: 'My form',
        fields: [],
        customerId: 'customer-1',
      });
      expect(result).toEqual({ id: 'form-1' });
    });
  });

  describe('getMine', () => {
    it("returns the caller's own form", async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'customer-1' });
      const controller = new CustomerExchangeContactFormsController(
        { getById } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.getMine(makeRequest(), 'form-1');

      expect(result).toEqual({ id: 'form-1', customerId: 'customer-1' });
    });

    it('throws NotFoundException when the form belongs to a different customer', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'someone-else' });
      const controller = new CustomerExchangeContactFormsController(
        { getById } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(controller.getMine(makeRequest(), 'form-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('checks ownership then delegates to update', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'customer-1' });
      const update = jest
        .fn()
        .mockResolvedValue({ form: { id: 'form-1' }, forked: false });
      const controller = new CustomerExchangeContactFormsController(
        { getById, update } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.update(makeRequest(), 'form-1', {
        fields: [],
      });

      expect(update).toHaveBeenCalledWith('form-1', { fields: [] });
      expect(result).toEqual({ form: { id: 'form-1' }, forked: false });
    });

    it('throws NotFoundException and never calls update when the form belongs to a different customer', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'someone-else' });
      const update = jest.fn();
      const controller = new CustomerExchangeContactFormsController(
        { getById, update } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.update(makeRequest(), 'form-1', { fields: [] }),
      ).rejects.toThrow(NotFoundException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('checks ownership then delegates to deleteForm', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'customer-1' });
      const deleteForm = jest.fn().mockResolvedValue(undefined);
      const controller = new CustomerExchangeContactFormsController(
        { getById, deleteForm } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await controller.remove(makeRequest(), 'form-1');

      expect(deleteForm).toHaveBeenCalledWith('form-1');
    });

    it('throws NotFoundException and never calls deleteForm for a foreign form', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'someone-else' });
      const deleteForm = jest.fn();
      const controller = new CustomerExchangeContactFormsController(
        { getById, deleteForm } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(controller.remove(makeRequest(), 'form-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(deleteForm).not.toHaveBeenCalled();
    });
  });

  describe('listVersions', () => {
    it('checks ownership then delegates to listVersions', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'customer-1' });
      const listVersions = jest.fn().mockResolvedValue([{ id: 'version-1' }]);
      const controller = new CustomerExchangeContactFormsController(
        { getById, listVersions } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      const result = await controller.listVersions(makeRequest(), 'form-1');

      expect(listVersions).toHaveBeenCalledWith('form-1');
      expect(result).toEqual([{ id: 'version-1' }]);
    });

    it('throws NotFoundException for a foreign form', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'someone-else' });
      const listVersions = jest.fn();
      const controller = new CustomerExchangeContactFormsController(
        { getById, listVersions } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.listVersions(makeRequest(), 'form-1'),
      ).rejects.toThrow(NotFoundException);
      expect(listVersions).not.toHaveBeenCalled();
    });
  });

  describe('removeVersion', () => {
    it('checks ownership then delegates to deleteVersion', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'customer-1' });
      const deleteVersion = jest.fn().mockResolvedValue(undefined);
      const controller = new CustomerExchangeContactFormsController(
        { getById, deleteVersion } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await controller.removeVersion(makeRequest(), 'form-1', 'version-1');

      expect(deleteVersion).toHaveBeenCalledWith('form-1', 'version-1');
    });

    it('throws NotFoundException and never calls deleteVersion for a foreign form', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'someone-else' });
      const deleteVersion = jest.fn();
      const controller = new CustomerExchangeContactFormsController(
        { getById, deleteVersion } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.removeVersion(makeRequest(), 'form-1', 'version-1'),
      ).rejects.toThrow(NotFoundException);
      expect(deleteVersion).not.toHaveBeenCalled();
    });
  });

  describe('setLinkedEcards', () => {
    it('checks ownership then delegates to setLinkedEcards', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'customer-1' });
      const setLinkedEcards = jest.fn().mockResolvedValue(undefined);
      const controller = new CustomerExchangeContactFormsController(
        {
          getById,
          setLinkedEcards,
        } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await controller.setLinkedEcards(makeRequest(), 'form-1', {
        ecardIds: ['ecard-1'],
      });

      expect(setLinkedEcards).toHaveBeenCalledWith('form-1', ['ecard-1']);
    });

    it('throws NotFoundException and never calls setLinkedEcards for a foreign form', async () => {
      const getByAccountId = jest.fn().mockResolvedValue({ id: 'customer-1' });
      const getById = jest
        .fn()
        .mockResolvedValue({ id: 'form-1', customerId: 'someone-else' });
      const setLinkedEcards = jest.fn();
      const controller = new CustomerExchangeContactFormsController(
        {
          getById,
          setLinkedEcards,
        } as unknown as ExchangeContactFormsService,
        { getByAccountId } as unknown as CustomersService,
      );

      await expect(
        controller.setLinkedEcards(makeRequest(), 'form-1', {
          ecardIds: ['ecard-1'],
        }),
      ).rejects.toThrow(NotFoundException);
      expect(setLinkedEcards).not.toHaveBeenCalled();
    });
  });
});
