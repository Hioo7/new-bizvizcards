import { Module } from '@nestjs/common';
import { EcardAnalyticsService } from './services/ecard-analytics.service';

@Module({
  providers: [EcardAnalyticsService],
  exports: [EcardAnalyticsService],
})
export class EcardAnalyticsModule {}
