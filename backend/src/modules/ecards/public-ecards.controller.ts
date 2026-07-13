import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { exchangeContactSchema } from '../leads/dto/exchange-contact.dto';
import type { ExchangeContactDto } from '../leads/dto/exchange-contact.dto';
import { LeadsService } from '../leads/services/leads.service';
import { EcardVCardService } from './services/ecard-vcard.service';
import { EcardsService } from './services/ecards.service';

@Controller('api/public/ecards')
export class PublicEcardsController {
  constructor(
    private readonly ecardsService: EcardsService,
    private readonly ecardVCardService: EcardVCardService,
    private readonly leadsService: LeadsService,
  ) {}

  @Get(':endpoint')
  get(@Param('endpoint') endpoint: string) {
    return this.ecardsService.getByEndpoint(endpoint);
  }

  @Post(':endpoint/exchange-contact')
  exchangeContact(
    @Param('endpoint') endpoint: string,
    @Body(new ZodValidationPipe(exchangeContactSchema))
    dto: ExchangeContactDto,
  ) {
    return this.leadsService.createFromEcardExchangeContact(endpoint, dto);
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

    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${endpoint}.vcf"`);
    res.send(text);
  }
}
