import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { DomainsService } from './domains.service';

@Controller('api')
export class DomainsController {
    constructor(private readonly domainsService: DomainsService) { }

    @Get('domains')
    getDomains() { return this.domainsService.getDomains(); }

    @Post('domains')
    createDomain(@Body() dto: any) { return this.domainsService.createDomain(dto); }

    @Put('domains/:id')
    updateDomain(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.domainsService.updateDomain(id, dto); }

    @Delete('domains/:id')
    deleteDomain(@Param('id', ParseIntPipe) id: number) { return this.domainsService.deleteDomain(id); }
}