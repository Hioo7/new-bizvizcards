import { UnsupportedMediaTypeException } from '@nestjs/common';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { CustomersController } from './customers.controller';
import type { CustomersService } from './services/customers.service';

function createRequest(accountId: string): CustomerAuthenticatedRequest {
  return {
    customerSession: { user: { id: accountId } },
  } as unknown as CustomerAuthenticatedRequest;
}

function createFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer: Buffer.from('fake-image-bytes'),
    originalname: 'avatar.png',
    mimetype: 'image/png',
    size: 16,
    ...overrides,
  } as Express.Multer.File;
}

describe('CustomersController', () => {
  it('replaces the profile picture and returns the new pfpMediaId', async () => {
    const getByAccountId = jest
      .fn()
      .mockResolvedValue({ id: 'customer-1', accountId: 'account-1' });
    const replaceProfilePicture = jest.fn().mockResolvedValue({
      customer: { id: 'customer-1', pfpMediaId: 'media-1' },
      pfpUrl: '/media/test-bucket/pfp/customer-1/media-1.png',
    });
    const customersService = {
      getByAccountId,
      replaceProfilePicture,
    } as unknown as CustomersService;
    const controller = new CustomersController(customersService);

    const result = await controller.replaceProfilePicture(
      createRequest('account-1'),
      createFile(),
    );

    expect(getByAccountId).toHaveBeenCalledWith('account-1');
    expect(replaceProfilePicture).toHaveBeenCalledWith('customer-1', {
      buffer: Buffer.from('fake-image-bytes'),
      contentType: 'image/png',
      originalName: 'avatar.png',
      extension: 'png',
    });
    expect(result).toEqual({
      pfpMediaId: 'media-1',
      pfpUrl: '/media/test-bucket/pfp/customer-1/media-1.png',
    });
  });

  it('rejects a disallowed extension even if the mimetype passed validation', async () => {
    const getByAccountId = jest.fn();
    const customersService = {
      getByAccountId,
      replaceProfilePicture: jest.fn(),
    } as unknown as CustomersService;
    const controller = new CustomersController(customersService);

    await expect(
      controller.replaceProfilePicture(
        createRequest('account-1'),
        createFile({ originalname: 'payload.svg', mimetype: 'image/png' }),
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(getByAccountId).not.toHaveBeenCalled();
  });

  it('removes the profile picture', async () => {
    const getByAccountId = jest
      .fn()
      .mockResolvedValue({ id: 'customer-1', accountId: 'account-1' });
    const removeProfilePicture = jest
      .fn()
      .mockResolvedValue({ pfpMediaId: null });
    const customersService = {
      getByAccountId,
      removeProfilePicture,
    } as unknown as CustomersService;
    const controller = new CustomersController(customersService);

    const result = await controller.removeProfilePicture(
      createRequest('account-1'),
    );

    expect(getByAccountId).toHaveBeenCalledWith('account-1');
    expect(removeProfilePicture).toHaveBeenCalledWith('customer-1');
    expect(result).toEqual({ pfpMediaId: null });
  });
});
