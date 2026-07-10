import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LeadsController } from './leads.controller';
import { LeadFoldersController } from './lead-folders.controller';
import { LeadReferenceNotesController } from './lead-reference-notes.controller';
import { LeadRemindersController } from './lead-reminders.controller';
import { RemindersController } from './reminders.controller';
import { LeadsService } from './services/leads.service';
import { LeadFoldersService } from './services/lead-folders.service';
import { LeadReferenceNotesService } from './services/lead-reference-notes.service';
import { RemindersService } from './services/reminders.service';

@Module({
  imports: [CustomersModule],
  controllers: [
    LeadsController,
    LeadFoldersController,
    LeadReferenceNotesController,
    LeadRemindersController,
    RemindersController,
  ],
  providers: [
    LeadsService,
    LeadFoldersService,
    LeadReferenceNotesService,
    RemindersService,
  ],
  exports: [LeadsService],
})
export class LeadsModule {}
