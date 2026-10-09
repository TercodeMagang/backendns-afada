import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    // ✅ GET summary (?user_id=X → non-admin hanya ringkasan miliknya)
    @Get('summary')
    getSummary(@Query('user_id') userId?: string) {
        return this.dashboardService.getSummary(userId ? Number(userId) : undefined);
    }
}