import { ForbiddenException } from '@nestjs/common';
import type { ExchangeContactFormsService } from '../../exchange-contact-forms/services/exchange-contact-forms.service';
import { OrganisationExchangeContactFormTemplateService } from './organisation-exchange-contact-form-template.service';
import type { OrganisationsService } from './organisations.service';

// Pure unit tests (mocked collaborators) — this service owns no Prisma
// queries of its own, it only adds the assertIsSpoc/assertIsMember
// authorization step in front of the already-fully-tested
// ExchangeContactFormsService org methods, so there's no real business
// logic here beyond "check, then delegate."
describe('OrganisationExchangeContactFormTemplateService', () => {
  describe('getForMember', () => {
    it('asserts membership then delegates to getByOrganisationId', async () => {
      const assertIsMember = jest.fn().mockResolvedValue(undefined);
      const getByOrganisationId = jest.fn().mockResolvedValue({ id: 'form-1' });
      const service = new OrganisationExchangeContactFormTemplateService(
        { assertIsMember } as unknown as OrganisationsService,
        {
          getByOrganisationId,
        } as unknown as ExchangeContactFormsService,
      );

      const result = await service.getForMember('customer-1', 'org-1');

      expect(assertIsMember).toHaveBeenCalledWith('customer-1', 'org-1');
      expect(getByOrganisationId).toHaveBeenCalledWith('org-1');
      expect(result).toEqual({ id: 'form-1' });
    });

    it('propagates when the caller is not a member and never calls getByOrganisationId', async () => {
      const assertIsMember = jest
        .fn()
        .mockRejectedValue(new ForbiddenException('not a member'));
      const getByOrganisationId = jest.fn();
      const service = new OrganisationExchangeContactFormTemplateService(
        { assertIsMember } as unknown as OrganisationsService,
        {
          getByOrganisationId,
        } as unknown as ExchangeContactFormsService,
      );

      await expect(service.getForMember('customer-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(getByOrganisationId).not.toHaveBeenCalled();
    });
  });

  describe('upsertForSpoc', () => {
    it('asserts SPOC then delegates to upsertForOrganisation', async () => {
      const assertIsSpoc = jest.fn().mockResolvedValue(undefined);
      const upsertForOrganisation = jest
        .fn()
        .mockResolvedValue({ form: { id: 'form-1' }, forked: false });
      const service = new OrganisationExchangeContactFormTemplateService(
        { assertIsSpoc } as unknown as OrganisationsService,
        {
          upsertForOrganisation,
        } as unknown as ExchangeContactFormsService,
      );
      const dto = { name: 'Org template', fields: [] };

      const result = await service.upsertForSpoc('customer-1', 'org-1', dto);

      expect(assertIsSpoc).toHaveBeenCalledWith('customer-1', 'org-1');
      expect(upsertForOrganisation).toHaveBeenCalledWith('org-1', dto);
      expect(result).toEqual({ form: { id: 'form-1' }, forked: false });
    });

    it('propagates when the caller is not a SPOC and never calls upsertForOrganisation', async () => {
      const assertIsSpoc = jest
        .fn()
        .mockRejectedValue(new ForbiddenException('not a spoc'));
      const upsertForOrganisation = jest.fn();
      const service = new OrganisationExchangeContactFormTemplateService(
        { assertIsSpoc } as unknown as OrganisationsService,
        {
          upsertForOrganisation,
        } as unknown as ExchangeContactFormsService,
      );

      await expect(
        service.upsertForSpoc('customer-1', 'org-1', {
          name: 'x',
          fields: [],
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(upsertForOrganisation).not.toHaveBeenCalled();
    });
  });

  describe('deleteForSpoc', () => {
    it('asserts SPOC then delegates to deleteForOrganisation', async () => {
      const assertIsSpoc = jest.fn().mockResolvedValue(undefined);
      const deleteForOrganisation = jest.fn().mockResolvedValue(undefined);
      const service = new OrganisationExchangeContactFormTemplateService(
        { assertIsSpoc } as unknown as OrganisationsService,
        {
          deleteForOrganisation,
        } as unknown as ExchangeContactFormsService,
      );

      await service.deleteForSpoc('customer-1', 'org-1');

      expect(assertIsSpoc).toHaveBeenCalledWith('customer-1', 'org-1');
      expect(deleteForOrganisation).toHaveBeenCalledWith('org-1');
    });

    it('propagates when the caller is not a SPOC and never calls deleteForOrganisation', async () => {
      const assertIsSpoc = jest
        .fn()
        .mockRejectedValue(new ForbiddenException('not a spoc'));
      const deleteForOrganisation = jest.fn();
      const service = new OrganisationExchangeContactFormTemplateService(
        { assertIsSpoc } as unknown as OrganisationsService,
        {
          deleteForOrganisation,
        } as unknown as ExchangeContactFormsService,
      );

      await expect(
        service.deleteForSpoc('customer-1', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(deleteForOrganisation).not.toHaveBeenCalled();
    });
  });
});
