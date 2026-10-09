import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('api')
export class DataController {
    constructor(private readonly dataService: DataService) { }

    @Get('guests')
    getGuests(@Query('user_id') userId?: string) {
        return this.dataService.getGuests(userId ? Number(userId) : undefined);
    }

    @Get('rsvps')
    getRsvps(@Query('user_id') userId?: string) {
        return this.dataService.getRsvps(userId ? Number(userId) : undefined);
    }

    // ✅ BARU: tamu publik mengirim RSVP + ucapan
    @Post('rsvps')
    createRsvp(@Body() dto: any) {
        return this.dataService.createRsvp(dto);
    }

    // ✅ BARU: tamu mengirim amplop digital dari halaman publik
    @Post('envelopes')
    createEnvelope(@Body() dto: any) {
        return this.dataService.createEnvelope(dto);
    }


    @Get('envelopes')
    getEnvelopes(@Query('user_id') userId?: string) {
        return this.dataService.getEnvelopes(userId ? Number(userId) : undefined);
    }

    // ✅ Riwayat transaksi (baca)
    @Get('transactions')
    getTransactions(@Query('user_id') userId?: string) {
        return this.dataService.getTransactions(userId ? Number(userId) : undefined);
    }

    // ✅ BARU: catat transaksi pembayaran dari checkout frontend
    @Post('transactions')
    createTransaction(@Body() dto: any) {
        return this.dataService.createTransaction(dto);
    }

    // ✅ TAMBAH TAMU
    @Post('guests')
    createGuest(@Body() dto: any) {
        return this.dataService.createGuest(dto);
    }

    // ✅ EDIT TAMU
    @Put('guests/:id')
    updateGuest(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
        return this.dataService.updateGuest(id, dto);
    }

    // ✅ HAPUS TAMU
    @Delete('guests/:id')
    deleteGuest(@Param('id', ParseIntPipe) id: number) {
        return this.dataService.deleteGuest(id);
    }

    @Patch('guests/:id/checkin')
    checkInGuest(@Param('id', ParseIntPipe) id: number) {
        return this.dataService.checkInGuest(id);
    }
}