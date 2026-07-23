import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../common/config/app-config.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CustomersModule } from '../customers/customers.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AppConfigModule, PrismaModule, CustomersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
