import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './common/config/app-config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './common/auth/auth.module';
import { GuardsModule } from './common/guards/guards.module';
import { MailerModule } from './common/mailer/mailer.module';
import { MediaModule } from './common/media/media.module';
import { CustomersModule } from './modules/customers/customers.module';
import { StaffModule } from './modules/staff/staff.module';
import { SmartCardsModule } from './modules/smart-cards/smart-cards.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { RedirectsModule } from './modules/redirects/redirects.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    GuardsModule,
    MailerModule,
    MediaModule,
    CustomersModule,
    StaffModule,
    SmartCardsModule,
    OrganisationsModule,
    RedirectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
