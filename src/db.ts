import { Pool } from 'pg';

// Konfigurasi koneksi ke PostgreSQL (sama persis dengan db.js di Express)
export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'invito_db',
    password: 'lupasandi1224',
    port: 5432,
});

pool.on('connect', () => {
    console.log('✅ Database connected successfully!');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});