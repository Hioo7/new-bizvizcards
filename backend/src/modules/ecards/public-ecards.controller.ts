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
import { ECardEventType } from '../../generated/prisma/client';
import { EcardAnalyticsService } from '../ecard-analytics/services/ecard-analytics.service';
import { recordViewDurationSchema } from '../ecard-analytics/dto/record-view-duration.dto';
import type { RecordViewDurationDto } from '../ecard-analytics/dto/record-view-duration.dto';
import { exchangeContactSchema } from '../leads/dto/exchange-contact.dto';
import type { ExchangeContactDto } from '../leads/dto/exchange-contact.dto';
import { LeadsService } from '../leads/services/leads.service';
import { PlanPolicyResolverService } from '../plans/services/plan-policy-resolver.service';
import { filterEcardComponentsByPolicy } from './ecard-policy-filter.util';
import { EcardVCardService } from './services/ecard-vcard.service';
import { EcardsService } from './services/ecards.service';
import { EcardOgPreviewService } from './services/ecard-og-preview.service';

@Controller('api/public/ecards')
export class PublicEcardsController {
  constructor(
    private readonly ecardsService: EcardsService,
    private readonly ecardVCardService: EcardVCardService,
    private readonly ecardOgPreviewService: EcardOgPreviewService,
    private readonly ecardAnalyticsService: EcardAnalyticsService,
    private readonly leadsService: LeadsService,
    private readonly planPolicyResolverService: PlanPolicyResolverService,
  ) {}

  @Get(':endpoint')
  async get(@Param('endpoint') endpoint: string) {
    const card = await this.ecardsService.getByEndpoint(endpoint);
    const policy =
      await this.planPolicyResolverService.getEffectiveEcardPolicyForCard({
        customerId: card.customerId,
        organisationId: card.organisationId,
      });
    if (!policy.isAvailable) {
      throw new NotFoundException('E-card not found');
    }

    const event = await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.VIEW,
    );
    return {
      card: filterEcardComponentsByPolicy(card, policy),
      viewEventId: event.id,
      exchangeContactAllowed: policy.exchangeContactAccess,
    };
  }

  @Post(':endpoint/view/:eventId/duration')
  async recordViewDuration(
    @Param('endpoint') endpoint: string,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(recordViewDurationSchema))
    dto: RecordViewDurationDto,
  ): Promise<void> {
    const card = await this.ecardsService.getByEndpoint(endpoint);
    await this.ecardAnalyticsService.recordViewDuration(
      card.id,
      eventId,
      dto.durationMs,
    );
  }

  @Post(':endpoint/exchange-contact')
  async exchangeContact(
    @Param('endpoint') endpoint: string,
    @Body(new ZodValidationPipe(exchangeContactSchema))
    dto: ExchangeContactDto,
  ) {
    const lead = await this.leadsService.createFromEcardExchangeContact(
      endpoint,
      dto,
    );
    const card = await this.ecardsService.getByEndpoint(endpoint);
    await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.EXCHANGE_CONTACT,
    );
    return lead;
  }

  @Get(':endpoint/vcard')
  async vcard(
    @Param('endpoint') endpoint: string,
    @Res() res: Response,
  ): Promise<void> {
    const card = await this.ecardsService.getByEndpoint(endpoint);
    const text = this.ecardVCardService.buildVCardText({
      name: card.hero.name,
      email: card.hero.email,
      companyName: card.hero.companyName,
      phoneCountryDialCode: card.hero.phoneCountryDialCode,
      phoneNumber: card.hero.phoneNumber,
    });
    await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.CONTACT_SAVE,
    );

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${endpoint}.vcf"`);
    res.send(text);
  }

  @Get(':endpoint/preview')
  async preview(
    @Param('endpoint') endpoint: string,
    @Res() res: Response,
  ): Promise<void> {
    const card = await this.ecardsService.getByEndpoint(endpoint);
    const fields = this.ecardOgPreviewService.buildFields(card);
    const html = this.ecardOgPreviewService.renderHtml(endpoint, fields);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
