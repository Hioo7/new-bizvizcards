import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { exchangeContactSchema } from '../leads/dto/exchange-contact.dto';
import type { ExchangeContactDto } from '../leads/dto/exchange-contact.dto';
import { LeadsService } from '../leads/services/leads.service';
import { PlanPolicyResolverService } from '../plans/services/plan-policy-resolver.service';
import { SmartCardsService } from './services/smart-cards.service';
import { SmartCardVCardService } from './services/smart-card-vcard.service';
import { SmartCardOgPreviewService } from './services/smart-card-og-preview.service';

@Controller('api/public/smart-cards')
export class PublicSmartCardsController {
  constructor(
    private readonly smartCardsService: SmartCardsService,
    private readonly smartCardVCardService: SmartCardVCardService,
    private readonly smartCardOgPreviewService: SmartCardOgPreviewService,
    private readonly leadsService: LeadsService,
    private readonly planPolicyResolverService: PlanPolicyResolverService,
  ) {}

  @Get(':endpoint')
  async get(@Param('endpoint') endpoint: string) {
    const card = await this.smartCardsService.getByEndpoint(endpoint);
    if (!card.customerId) {
      // Unclaimed — fully exempt from plan enforcement.
      return { ...card, exchangeContactAllowed: true };
    }

    const policy =
      await this.planPolicyResolverService.getEffectiveSmartCardPolicy({
        customerId: card.customerId,
      });
    if (!policy?.isAvailable) {
      throw new NotFoundException('Smart card not found');
    }
    return { ...card, exchangeContactAllowed: policy.exchangeContactAccess };
  }

  @Post(':endpoint/exchange-contact')
  exchangeContact(
    @Param('endpoint') endpoint: string,
    @Body(new ZodValidationPipe(exchangeContactSchema))
    dto: ExchangeContactDto,
  ) {
    return this.leadsService.createFromExchangeContact(endpoint, dto);
  }

  @Get(':endpoint/vcard')
  async vcard(
    @Param('endpoint') endpoint: string,
    @Res() res: Response,
  ): Promise<void> {
    const card = await this.smartCardsService.getByEndpoint(endpoint);
    const text = this.smartCardVCardService.buildVCardText({
      companyName: card.profile?.companyName ?? null,
      founderName: card.founder?.name ?? null,
      contactNumber: card.contact?.contactNumber ?? null,
      email: card.contact?.email ?? null,
      address: card.contact?.address ?? null,
      website: card.socialMedia?.website ?? null,
    });

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${endpoint}.vcf"`);
    res.send(text);
  }

  @Get(':endpoint/preview')
  async preview(
    @Param('endpoint') endpoint: string,
    @Res() res: Response,
  ): Promise<void> {
    const card = await this.smartCardsService.getByEndpoint(endpoint);
    const fields = this.smartCardOgPreviewService.buildFields(card);
    const html = this.smartCardOgPreviewService.renderHtml(endpoint, fields);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
