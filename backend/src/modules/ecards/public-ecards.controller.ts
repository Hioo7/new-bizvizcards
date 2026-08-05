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
import { submitCustomFormExchangeContactSchema } from '../exchange-contact-forms/dto/submit-custom-form-exchange-contact.dto';
import type { SubmitCustomFormExchangeContactDto } from '../exchange-contact-forms/dto/submit-custom-form-exchange-contact.dto';
import { ExchangeContactFormResolutionService } from '../exchange-contact-forms/services/exchange-contact-form-resolution.service';
import { exchangeContactSchema } from '../leads/dto/exchange-contact.dto';
import type { ExchangeContactDto } from '../leads/dto/exchange-contact.dto';
import { LeadsService } from '../leads/services/leads.service';
import { OrganisationEcardTemplateService } from '../organisations/services/organisation-ecard-template.service';
import { PlanPolicyResolverService } from '../plans/services/plan-policy-resolver.service';
import { filterEcardComponentsByPolicy } from './ecard-policy-filter.util';
import { resolveEffectiveAccentColors } from './hero-accent-color-fallback.util';
import { resolveEffectiveIconShape } from './hero-icon-shape-fallback.util';
import { resolveEffectiveHeroLayout } from './hero-layout-fallback.util';
import { resolveEffectiveTheme } from './hero-theme-fallback.util';
import { mergeOrganisationEcardTemplateOntoCard } from './organisation-ecard-template-merge.util';
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
    private readonly organisationEcardTemplateService: OrganisationEcardTemplateService,
    private readonly exchangeContactFormResolutionService: ExchangeContactFormResolutionService,
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

    // Content assembly (org template, if this card is linked to one) runs
    // before the plan-availability gate, so even org-injected components
    // still respect what the plan actually allows.
    const template = card.organisationId
      ? await this.organisationEcardTemplateService.getByOrganisationId(
          card.organisationId,
        )
      : null;
    const mergedCard = mergeOrganisationEcardTemplateOntoCard(card, template);
    const layoutResolvedCard = resolveEffectiveHeroLayout(mergedCard, policy);
    const themeResolvedCard = resolveEffectiveTheme(layoutResolvedCard, policy);
    const iconShapeResolvedCard = resolveEffectiveIconShape(
      themeResolvedCard,
      policy,
    );
    const accentColorResolvedCard = resolveEffectiveAccentColors(
      iconShapeResolvedCard,
      policy,
    );

    const event = await this.ecardAnalyticsService.recordEvent(
      card.id,
      ECardEventType.VIEW,
    );
    const exchangeContactForm =
      await this.exchangeContactFormResolutionService.resolveForCard(card);
    return {
      card: filterEcardComponentsByPolicy(accentColorResolvedCard, policy),
      viewEventId: event.id,
      exchangeContactAllowed: policy.exchangeContactAccess,
      exchangeContactForm,
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

  // Left entirely separate from exchangeContact above (not a shared/branching
  // handler) — this only runs when GET's exchangeContactForm was non-null;
  // an e-card with no custom form resolved keeps using the legacy endpoint
  // above unchanged.
  @Post(':endpoint/custom-form-exchange-contact')
  async customFormExchangeContact(
    @Param('endpoint') endpoint: string,
    @Body(new ZodValidationPipe(submitCustomFormExchangeContactSchema))
    dto: SubmitCustomFormExchangeContactDto,
  ) {
    const lead =
      await this.leadsService.createFromEcardCustomFormExchangeContact(
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
