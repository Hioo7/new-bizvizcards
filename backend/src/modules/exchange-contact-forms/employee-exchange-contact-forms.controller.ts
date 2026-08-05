import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createExchangeContactFormSchema,
  type CreateExchangeContactFormDto,
} from './dto/create-exchange-contact-form.dto';
import {
  linkExchangeContactFormEcardsSchema,
  type LinkExchangeContactFormEcardsDto,
} from './dto/link-exchange-contact-form-ecards.dto';
import {
  listExchangeContactFormsQuerySchema,
  type ListExchangeContactFormsQueryDto,
} from './dto/list-exchange-contact-forms-query.dto';
import {
  updateExchangeContactFormSchema,
  type UpdateExchangeContactFormDto,
} from './dto/update-exchange-contact-form.dto';
import { ExchangeContactFormsService } from './services/exchange-contact-forms.service';

@Controller('api/employee/exchange-contact-forms')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeExchangeContactFormsController {
  constructor(
    private readonly exchangeContactFormsService: ExchangeContactFormsService,
  ) {}

  @Get()
  @RequirePermissions({ exchangeContactForm: ['list'] })
  list(
    @Query(new ZodValidationPipe(listExchangeContactFormsQuerySchema))
    query: ListExchangeContactFormsQueryDto,
  ) {
    return this.exchangeContactFormsService.listForCustomer(query.customerId);
  }

  @Post()
  @RequirePermissions({ exchangeContactForm: ['create'] })
  create(
    @Body(new ZodValidationPipe(createExchangeContactFormSchema))
    dto: CreateExchangeContactFormDto,
  ) {
    return this.exchangeContactFormsService.create(dto);
  }

  @Get(':formId')
  @RequirePermissions({ exchangeContactForm: ['get'] })
  get(@Param('formId') formId: string) {
    return this.exchangeContactFormsService.getById(formId);
  }

  @Patch(':formId')
  @RequirePermissions({ exchangeContactForm: ['update'] })
  update(
    @Param('formId') formId: string,
    @Body(new ZodValidationPipe(updateExchangeContactFormSchema))
    dto: UpdateExchangeContactFormDto,
  ) {
    return this.exchangeContactFormsService.update(formId, dto);
  }

  @Delete(':formId')
  @RequirePermissions({ exchangeContactForm: ['delete'] })
  async remove(@Param('formId') formId: string): Promise<void> {
    await this.exchangeContactFormsService.deleteForm(formId);
  }

  @Get(':formId/versions')
  @RequirePermissions({ exchangeContactForm: ['get'] })
  listVersions(@Param('formId') formId: string) {
    return this.exchangeContactFormsService.listVersions(formId);
  }

  @Delete(':formId/versions/:versionId')
  @RequirePermissions({ exchangeContactForm: ['delete'] })
  async removeVersion(
    @Param('formId') formId: string,
    @Param('versionId') versionId: string,
  ): Promise<void> {
    await this.exchangeContactFormsService.deleteVersion(formId, versionId);
  }

  @Put(':formId/linked-ecards')
  @RequirePermissions({ exchangeContactForm: ['update'] })
  async setLinkedEcards(
    @Param('formId') formId: string,
    @Body(new ZodValidationPipe(linkExchangeContactFormEcardsSchema))
    dto: LinkExchangeContactFormEcardsDto,
  ): Promise<void> {
    await this.exchangeContactFormsService.setLinkedEcards(
      formId,
      dto.ecardIds,
    );
  }
}
