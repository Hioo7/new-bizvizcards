import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SmartCardsService } from './services/smart-cards.service';
import { SmartCardVCardService } from './services/smart-card-vcard.service';

@Controller('api/public/smart-cards')
export class PublicSmartCardsController {
  constructor(
    private readonly smartCardsService: SmartCardsService,
    private readonly smartCardVCardService: SmartCardVCardService,
  ) {}

  @Get(':endpoint')
  get(@Param('endpoint') endpoint: string) {
    return this.smartCardsService.getByEndpoint(endpoint);
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
}
