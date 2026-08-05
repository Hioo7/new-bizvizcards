import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { CustomerEmailSignaturesController } from './customer-email-signatures.controller';
import { EmailSignaturesService } from './services/email-signatures.service';

// MediaModule/MediaSlotResolverService are @Global(), no explicit import
// needed — same convention as ExchangeContactFormsModule/SmartCardsModule.
@Module({
  imports: [PlansModule, CustomersModule],
  controllers: [CustomerEmailSignaturesController],
  providers: [EmailSignaturesService],
  exports: [EmailSignaturesService],
})
export class EmailSignaturesModule {}
