import { AccountsModule } from './accounts/accounts.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InvitationsModule } from './invitations/invitations.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DataModule } from './data/data.module';



@Module({
    imports: [AccountsModule, InvitationsModule, AuthModule, DashboardModule, DataModule],
    controllers: [AppController],
})
export class AppModule { }