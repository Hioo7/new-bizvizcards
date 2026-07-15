import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LeadsModule } from '../leads/leads.module';
import { OrganisationsModule } from '../organisations/organisations.module';
import { EcardAnalyticsModule } from '../ecard-analytics/ecard-analytics.module';
import { EcardsController } from './ecards.controller';
import { EmployeeEcardsController } from './employee-ecards.controller';
import { EmployeeOrganisationMemberEcardController } from './employee-organisation-member-ecard.controller';
import { OrganisationEcardsController } from './organisation-ecards.controller';
import { PublicEcardsController } from './public-ecards.controller';
import { EcardVCardService } from './services/ecard-vcard.service';
import { EcardsService } from './services/ecards.service';
import { EcardOgPreviewService } from './services/ecard-og-preview.service';
import { EcardGoogleWalletService } from './services/ecard-google-wallet.service';
import { EcardAppleWalletService } from './services/ecard-apple-wallet.service';

@Module({
  imports: [
    CustomersModule,
    LeadsModule,
    EcardAnalyticsModule,
    OrganisationsModule,
  ],
  controllers: [
    EcardsController,
    EmployeeEcardsController,
    PublicEcardsController,
    OrganisationEcardsController,
    EmployeeOrganisationMemberEcardController,
  ],
  providers: [
    EcardsService,
    EcardVCardService,
    EcardOgPreviewService,
    EcardGoogleWalletService,
    EcardAppleWalletService,
  ],
  exports: [EcardsService],
})
export class EcardsModule {}
