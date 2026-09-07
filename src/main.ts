import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { pool } from './db';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // sama seperti app.use(cors()) di Express

    // Tes koneksi database (biar muncul log "connected" seperti di Express)
    await pool.query('SELECT 1');

    await app.listen(5000);
    console.log('Server berjalan di http://localhost:5000');
}
bootstrap();