import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { SmartCardsController } from './smart-cards.controller';
import { SmartCardTemplatesController } from './smart-card-templates.controller';
import { PublicSmartCardsController } from './public-smart-cards.controller';
import { SmartCardsService } from './services/smart-cards.service';
import { SmartCardTemplatesService } from './services/smart-card-templates.service';
import { SmartCardVCardService } from './services/smart-card-vcard.service';
import { SmartCardOgPreviewService } from './services/smart-card-og-preview.service';

@Module({
  imports: [LeadsModule],
  controllers: [
    SmartCardsController,
    SmartCardTemplatesController,
    PublicSmartCardsController,
  ],
  providers: [
    SmartCardsService,
    SmartCardTemplatesService,
    SmartCardVCardService,
    SmartCardOgPreviewService,
  ],
})
export class SmartCardsModule {}
