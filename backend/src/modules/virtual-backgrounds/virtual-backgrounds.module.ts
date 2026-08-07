import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PlansModule } from '../plans/plans.module';
import { VirtualBackgroundTemplatesController } from './virtual-background-templates.controller';
import { VirtualBackgroundsController } from './virtual-backgrounds.controller';
import { VirtualBackgroundComposerService } from './services/virtual-background-composer.service';
import { VirtualBackgroundTemplatesService } from './services/virtual-background-templates.service';
import { VirtualBackgroundsService } from './services/virtual-backgrounds.service';

@Module({
  imports: [CustomersModule, PlansModule],
  controllers: [
    VirtualBackgroundTemplatesController,
    VirtualBackgroundsController,
  ],
  providers: [
    VirtualBackgroundComposerService,
    VirtualBackgroundTemplatesService,
    VirtualBackgroundsService,
  ],
  exports: [VirtualBackgroundTemplatesService, VirtualBackgroundsService],
})
export class VirtualBackgroundsModule {}
