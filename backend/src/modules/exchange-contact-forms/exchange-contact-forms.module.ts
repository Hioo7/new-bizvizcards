import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { CustomerExchangeContactFormsController } from './customer-exchange-contact-forms.controller';
import { EmployeeExchangeContactFormsController } from './employee-exchange-contact-forms.controller';
import { ExchangeContactFormResolutionService } from './services/exchange-contact-form-resolution.service';
import { ExchangeContactFormsService } from './services/exchange-contact-forms.service';

@Module({
  imports: [PlansModule, CustomersModule],
  controllers: [
    EmployeeExchangeContactFormsController,
    CustomerExchangeContactFormsController,
  ],
  providers: [
    ExchangeContactFormsService,
    ExchangeContactFormResolutionService,
  ],
  exports: [ExchangeContactFormsService, ExchangeContactFormResolutionService],
})
export class ExchangeContactFormsModule {}
