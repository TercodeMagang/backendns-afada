import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('api')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('notifications')
    getNotifications(@Query('user_id', ParseIntPipe) userId: number) {
        return this.notificationsService.getNotifications(userId);
    }

    @Put('notifications/read-all')
    markAllRead(@Query('user_id', ParseIntPipe) userId: number) {
        return this.notificationsService.markAllRead(userId);
    }

    @Put('notifications/:id/read')
    markRead(@Param('id', ParseIntPipe) id: number) {
        return this.notificationsService.markRead(id);
    }

    @Post('notifications')
    createNotification(@Body() dto: any) {
        return this.notificationsService.createNotification(dto);
    }
}