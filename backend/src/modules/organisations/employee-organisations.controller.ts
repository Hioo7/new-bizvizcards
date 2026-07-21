import { extname } from 'path';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { parseMultipartJson } from '../ecards/utils/parse-multipart-json';
import { addOrganisationMemberAsEmployeeSchema } from './dto/add-organisation-member-as-employee.dto';
import type { AddOrganisationMemberAsEmployeeDto } from './dto/add-organisation-member-as-employee.dto';
import { createOrganisationAsEmployeeSchema } from './dto/create-organisation-as-employee.dto';
import type { CreateOrganisationAsEmployeeDto } from './dto/create-organisation-as-employee.dto';
import { listOrganisationsQuerySchema } from './dto/list-organisations-query.dto';
import type { ListOrganisationsQueryDto } from './dto/list-organisations-query.dto';
import { organisationEcardTemplateSchema } from './dto/organisation-ecard-template.dto';
import type { OrganisationEcardTemplateDto } from './dto/organisation-ecard-template.dto';
import { updateMemberSchema } from './dto/update-member.dto';
import type { UpdateMemberDto } from './dto/update-member.dto';
import { updateOrganisationSchema } from './dto/update-organisation.dto';
import type { UpdateOrganisationDto } from './dto/update-organisation.dto';
import {
  ORGANISATION_ECARD_TEMPLATE_MULTIPART_DATA_FIELD,
  ORGANISATION_LOGO_ALLOWED_EXTENSIONS,
  ORGANISATION_LOGO_ALLOWED_MIME_TYPE_PATTERN,
  ORGANISATION_LOGO_MAX_SIZE_BYTES,
} from './organisations.constants';
import { OrganisationEcardTemplateService } from './services/organisation-ecard-template.service';
import { OrganisationMembersService } from './services/organisation-members.service';
import { OrganisationsService } from './services/organisations.service';
import { assertValidOrganisationEcardTemplateFiles } from './utils/assert-valid-organisation-ecard-template-files';

const ECARD_TEMPLATE_FILE_VALIDATION_PIPE = new ParseFilePipe({
  fileIsRequired: false,
});

@Controller('api/employee/organisations')
@UseGuards(EmployeeAuthGuard, PermissionsGuard)
export class EmployeeOrganisationsController {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly organisationMembersService: OrganisationMembersService,
    private readonly organisationEcardTemplateService: OrganisationEcardTemplateService,
  ) {}

  @Get()
  @RequirePermissions({ organisation: ['list'] })
  list(
    @Query(new ZodValidationPipe(listOrganisationsQuerySchema))
    query: ListOrganisationsQueryDto,
  ) {
    return this.organisationsService.listAllForEmployee(query);
  }

  @Post()
  @RequirePermissions({ organisation: ['create'] })
  async create(
    @Body(new ZodValidationPipe(createOrganisationAsEmployeeSchema))
    dto: CreateOrganisationAsEmployeeDto,
  ) {
    const { customerId, ...rest } = dto;
    const { organisation, membership } = await this.organisationsService.create(
      customerId,
      rest,
    );
    // Re-fetch through the employee-facing summary path so this response has
    // the same shape (resolved logoUrl) as every other employee endpoint —
    // organisationsService.create() returns the raw customer-facing model.
    return {
      organisation: await this.organisationsService.getByIdForEmployee(
        organisation.id,
      ),
      membership,
    };
  }

  @Get('by-customer/:customerId')
  @RequirePermissions({ organisation: ['get'] })
  listMembershipsByCustomer(@Param('customerId') customerId: string) {
    return this.organisationsService.listMembershipsWithOrgDetails(customerId);
  }

  @Get(':organisationId/members')
  @RequirePermissions({ organisation: ['get'] })
  listMembersByOrganisation(@Param('organisationId') organisationId: string) {
    return this.organisationMembersService.listByOrganisationId(organisationId);
  }

  @Get(':organisationId/ecard-template')
  @RequirePermissions({ organisation: ['get'] })
  getEcardTemplate(@Param('organisationId') organisationId: string) {
    return this.organisationEcardTemplateService.getByOrganisationId(
      organisationId,
    );
  }

  @Put(':organisationId/ecard-template')
  @RequirePermissions({ organisation: ['update'] })
  @UseInterceptors(AnyFilesInterceptor())
  async updateEcardTemplate(
    @Param('organisationId') organisationId: string,
    @UploadedFiles(ECARD_TEMPLATE_FILE_VALIDATION_PIPE)
    files: Express.Multer.File[],
    @Body(ORGANISATION_ECARD_TEMPLATE_MULTIPART_DATA_FIELD) rawData: string,
  ) {
    assertValidOrganisationEcardTemplateFiles(files);
    const dto = parseMultipartJson<OrganisationEcardTemplateDto>(
      organisationEcardTemplateSchema,
      rawData,
    );
    return this.organisationEcardTemplateService.upsertForEmployee(
      organisationId,
      dto,
      files,
    );
  }

  @Delete(':organisationId/ecard-template')
  @RequirePermissions({ organisation: ['update'] })
  async deleteEcardTemplate(
    @Param('organisationId') organisationId: string,
  ): Promise<void> {
    await this.organisationEcardTemplateService.deleteForEmployee(
      organisationId,
    );
  }

  @Post(':organisationId/members')
  @RequirePermissions({ organisation: ['update'] })
  addMembers(
    @Param('organisationId') organisationId: string,
    @Body(new ZodValidationPipe(addOrganisationMemberAsEmployeeSchema))
    dto: AddOrganisationMemberAsEmployeeDto,
  ) {
    return this.organisationMembersService.addMembersForEmployee(
      organisationId,
      dto,
    );
  }

  @Patch('members/:id')
  @RequirePermissions({ organisation: ['update'] })
  updateMember(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMemberSchema)) dto: UpdateMemberDto,
  ) {
    return this.organisationMembersService.updateForEmployee(id, dto);
  }

  @Delete('members/:id')
  @RequirePermissions({ organisation: ['update'] })
  async removeMember(@Param('id') id: string): Promise<void> {
    await this.organisationMembersService.removeForEmployee(id);
  }

  @Get(':id')
  @RequirePermissions({ organisation: ['get'] })
  get(@Param('id') id: string) {
    return this.organisationsService.getByIdForEmployee(id);
  }

  @Patch(':id')
  @RequirePermissions({ organisation: ['update'] })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrganisationSchema))
    dto: UpdateOrganisationDto,
  ) {
    return this.organisationsService.updateForEmployee(id, dto);
  }

  @Patch(':id/logo')
  @RequirePermissions({ organisation: ['update'] })
  @UseInterceptors(FileInterceptor('file'))
  async replaceLogo(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: ORGANISATION_LOGO_MAX_SIZE_BYTES,
          }),
          new FileTypeValidator({
            fileType: ORGANISATION_LOGO_ALLOWED_MIME_TYPE_PATTERN,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (!ORGANISATION_LOGO_ALLOWED_EXTENSIONS.includes(extension)) {
      throw new UnsupportedMediaTypeException();
    }

    const result = await this.organisationsService.replaceLogo(id, {
      buffer: file.buffer,
      contentType: file.mimetype,
      originalName: file.originalname,
      extension,
    });

    return {
      logoMediaId: result.organisation.logoMediaId,
      logoUrl: result.logoUrl,
    };
  }

  @Delete(':id/logo')
  @RequirePermissions({ organisation: ['update'] })
  async removeLogo(@Param('id') id: string) {
    const updated = await this.organisationsService.removeLogo(id);
    return { logoMediaId: updated.logoMediaId };
  }

  @Delete(':id')
  @RequirePermissions({ organisation: ['delete'] })
  async remove(@Param('id') id: string): Promise<void> {
    await this.organisationsService.removeForEmployee(id);
  }
}
