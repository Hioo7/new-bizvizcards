import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LeadsModule } from '../leads/leads.module';
import { EcardsController } from './ecards.controller';
import { EmployeeEcardsController } from './employee-ecards.controller';
import { PublicEcardsController } from './public-ecards.controller';
import { EcardVCardService } from './services/ecard-vcard.service';
import { EcardsService } from './services/ecards.service';

@Module({
  imports: [CustomersModule, LeadsModule],
  controllers: [
    EcardsController,
    EmployeeEcardsController,
    PublicEcardsController,
  ],
  providers: [EcardsService, EcardVCardService],
  exports: [EcardsService],
})
export class EcardsModule {}
