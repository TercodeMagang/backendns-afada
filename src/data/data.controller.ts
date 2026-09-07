import { Controller, Get } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('api')
export class DataController {
    constructor(private readonly dataService: DataService) { }

    @Get('guests')
    getGuests() {
        return this.dataService.getGuests();
    }

    @Get('rsvps')
    getRsvps() {
        return this.dataService.getRsvps();
    }

    @Get('envelopes')
    getEnvelopes() {
        return this.dataService.getEnvelopes();
    }
}
