import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('api')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Get('users') getUsers() { return this.accountsService.getUsers(); }
    @Post('users') createUser(@Body() dto: any) { return this.accountsService.createUser(dto); }
    @Put('users/:id') updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.accountsService.updateUser(id, dto); }
    @Delete('users/:id') deleteUser(@Param('id', ParseIntPipe) id: number) { return this.accountsService.deleteUser(id); }

    @Get('admins') getAdmins() { return this.accountsService.getAdmins(); }
    @Post('admins') createAdmin(@Body() dto: any) { return this.accountsService.createAdmin(dto); }
    @Put('admins/:id') updateAdmin(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.accountsService.updateAdmin(id, dto); }
    @Delete('admins/:id') deleteAdmin(@Param('id', ParseIntPipe) id: number) { return this.accountsService.deleteAdmin(id); }
}