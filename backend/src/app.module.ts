import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './common/config/app-config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { GuardsModule } from './common/guards/guards.module';

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule, GuardsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
