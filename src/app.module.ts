import { AccountsModule } from './accounts/accounts.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InvitationsModule } from './invitations/invitations.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DataModule } from './data/data.module';
import { DomainsModule } from './domains/domains.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PackagesModule } from './packages/packages.module';

@Module({
    imports: [
        AccountsModule,
        InvitationsModule,
        AuthModule,
        DashboardModule,
        DataModule,
        DomainsModule,
        NotificationsModule,
        PackagesModule,
    ],
    controllers: [AppController],
})
export class AppModule { }