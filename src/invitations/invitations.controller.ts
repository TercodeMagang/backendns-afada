import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

@Controller('api/invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    // GET semua undangan (?user_id=X → filter pemilik untuk role non-admin)
    @Get()
    findAll(@Query('user_id') userId?: string) {
        return this.invitationsService.findAll(userId ? Number(userId) : undefined);
    }

    // ✅ BARU: GET 1 undangan berdasarkan ID
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.invitationsService.findOne(id);
    }

    // ✅ BARU: POST buat undangan baru
    @Post()
    @HttpCode(201) // Mengembalikan status 201 Created (sama seperti Express)
    create(@Body() body: { coupleName: string; theme?: string; status?: string; visits?: number; settings?: any; user_id?: number }) {
        return this.invitationsService.create(body);
    }

    // ✅ BARU: PUT update undangan
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.invitationsService.update(id, body);
    }

    // ✅ BARU: tambah counter kunjungan setiap halaman publik dibuka
    @Patch(':id/visit')
    incrementVisit(@Param('id', ParseIntPipe) id: number) {
        return this.invitationsService.incrementVisit(id);
    }

    // ✅ BARU: DELETE hapus undangan
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.invitationsService.remove(id);
    }
}