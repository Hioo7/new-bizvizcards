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
import { EcardsModule } from './modules/ecards/ecards.module';
import { RedirectsModule } from './modules/redirects/redirects.module';
import { PlansModule } from './modules/plans/plans.module';
import { BusinessEventsModule } from './modules/business-events/business-events.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductLinkingModule } from './modules/product-linking/product-linking.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';

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
    EcardsModule,
    RedirectsModule,
    PlansModule,
    BusinessEventsModule,
    ProductsModule,
    ProductLinkingModule,
    AddressesModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
