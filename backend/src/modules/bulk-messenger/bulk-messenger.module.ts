import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { CustomerBulkMessengerController } from './customer-bulk-messenger.controller';
import { BulkMessagePlaceholderService } from './services/bulk-message-placeholder.service';
import { BulkMessageSendsService } from './services/bulk-message-sends.service';
import { BulkMessageTemplatesService } from './services/bulk-message-templates.service';

@Module({
  imports: [PlansModule, CustomersModule],
  controllers: [CustomerBulkMessengerController],
  providers: [
    BulkMessagePlaceholderService,
    BulkMessageTemplatesService,
    BulkMessageSendsService,
  ],
})
export class BulkMessengerModule {}
