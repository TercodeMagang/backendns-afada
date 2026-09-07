import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

@Controller('api/invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    // GET semua undangan
    @Get()
    findAll() {
        return this.invitationsService.findAll();
    }

    // ✅ BARU: GET 1 undangan berdasarkan ID
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.invitationsService.findOne(id);
    }

    // ✅ BARU: POST buat undangan baru
    @Post()
    @HttpCode(201) // Mengembalikan status 201 Created (sama seperti Express)
    create(@Body() body: { coupleName: string; theme?: string }) {
        return this.invitationsService.create(body);
    }

    // ✅ BARU: PUT update undangan
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.invitationsService.update(id, body);
    }

    // ✅ BARU: DELETE hapus undangan
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.invitationsService.remove(id);
    }
}