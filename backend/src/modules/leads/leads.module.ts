import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LeadsController } from './leads.controller';
import { LeadFoldersController } from './lead-folders.controller';
import { LeadsService } from './services/leads.service';
import { LeadFoldersService } from './services/lead-folders.service';

@Module({
  imports: [CustomersModule],
  controllers: [LeadsController, LeadFoldersController],
  providers: [LeadsService, LeadFoldersService],
  exports: [LeadsService],
})
export class LeadsModule {}
