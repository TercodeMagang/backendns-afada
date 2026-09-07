import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello(): string {
        return 'Halo! Backend Invito sudah berjalan dengan baik 🚀';
    }
}