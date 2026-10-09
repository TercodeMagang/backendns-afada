import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { PackagesService } from './packages.service';

@Controller('api')
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    @Get('packages')
    getPackages() { return this.packagesService.getPackages(); }

    @Get('packages/all')
    getAllPackages() { return this.packagesService.getAllPackages(); }

    @Post('packages')
    createPackage(@Body() dto: any) { return this.packagesService.createPackage(dto); }

    @Put('packages/:id')
    updatePackage(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.packagesService.updatePackage(id, dto); }

    @Delete('packages/:id')
    deletePackage(@Param('id', ParseIntPipe) id: number) { return this.packagesService.deletePackage(id); }
}