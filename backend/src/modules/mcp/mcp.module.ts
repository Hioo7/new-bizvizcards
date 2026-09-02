import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LeadsModule } from '../leads/leads.module';
import { McpServerService } from './services/mcp-server.service';

@Module({
  imports: [CustomersModule, LeadsModule],
  providers: [McpServerService],
  exports: [McpServerService],
})
export class McpModule {}
