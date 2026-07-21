import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { CustomersService } from '../customers/services/customers.service';
import { parseMultipartJson } from '../ecards/utils/parse-multipart-json';
import { organisationEcardTemplateSchema } from './dto/organisation-ecard-template.dto';
import type { OrganisationEcardTemplateDto } from './dto/organisation-ecard-template.dto';
import { ORGANISATION_ECARD_TEMPLATE_MULTIPART_DATA_FIELD } from './organisations.constants';
import { OrganisationEcardTemplateService } from './services/organisation-ecard-template.service';
import { assertValidOrganisationEcardTemplateFiles } from './utils/assert-valid-organisation-ecard-template-files';

const FILE_VALIDATION_PIPE = new ParseFilePipe({ fileIsRequired: false });

// SPOC-side (customer-authenticated) e-card template management. Mirrors
// organisation-ecards.controller.ts's shape exactly: the controller does no
// authorization itself — it resolves the acting customer and delegates, and
// the service is what actually calls organisationsService.assertIsSpoc (for
// the write) / assertIsMember (for the read) as its first statement.
@Controller('api/organisations/:organisationId/ecard-template')
@UseGuards(CustomerAuthGuard)
export class OrganisationEcardTemplateController {
  constructor(
    private readonly organisationEcardTemplateService: OrganisationEcardTemplateService,
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  async get(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.organisationEcardTemplateService.getForMember(
      customer.id,
      organisationId,
    );
  }

  @Put()
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
    @UploadedFiles(FILE_VALIDATION_PIPE) files: Express.Multer.File[],
    @Body(ORGANISATION_ECARD_TEMPLATE_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidOrganisationEcardTemplateFiles(files);
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    const dto = parseMultipartJson<OrganisationEcardTemplateDto>(
      organisationEcardTemplateSchema,
      rawData,
    );
    return this.organisationEcardTemplateService.upsertForSpoc(
      customer.id,
      organisationId,
      dto,
      files,
    );
  }

  @Delete()
  async delete(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('organisationId') organisationId: string,
  ): Promise<void> {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    await this.organisationEcardTemplateService.deleteForSpoc(
      customer.id,
      organisationId,
    );
  }
}
