import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import type { CustomerAuthenticatedRequest } from '../../common/guards/customer-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from '../customers/services/customers.service';
import { scanGuestSchema } from './dto/scan-guest.dto';
import type { ScanGuestDto } from './dto/scan-guest.dto';
import { EventScanningService } from './services/event-scanning.service';

// Customer-authenticated only — scanning is a host/co-host/volunteer action,
// never an employee one (confirmed decision, see the plan doc).
@Controller('api/customer/business-events/:eventId')
@UseGuards(CustomerAuthGuard)
export class EventScanController {
  constructor(
    private readonly eventScanningService: EventScanningService,
    private readonly customersService: CustomersService,
  ) {}

  @Post('scan')
  async scanGate(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(scanGuestSchema)) dto: ScanGuestDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventScanningService.scanGate(eventId, customer.id, dto);
  }

  @Post('trackables/:trackableId/scan')
  async scanTrackable(
    @Req() request: CustomerAuthenticatedRequest,
    @Param('eventId') eventId: string,
    @Param('trackableId') trackableId: string,
    @Body(new ZodValidationPipe(scanGuestSchema)) dto: ScanGuestDto,
  ) {
    const customer = await this.customersService.getByAccountId(
      request.customerSession.user.id,
    );
    return this.eventScanningService.scanTrackable(
      eventId,
      trackableId,
      customer.id,
      dto,
    );
  }
}
