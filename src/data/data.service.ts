import { Injectable } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class DataService {
    // GET /api/guests → tabel guests
    async getGuests() {
        const res = await pool.query(
            `SELECT id, name, whatsapp, table_number, seat_number, category,
              check_in_status, rsvp_status, created_at
       FROM guests ORDER BY id`,
        );
        return { success: true, data: res.rows };
    }

    // GET /api/rsvps → tabel rsvps
    async getRsvps() {
        const res = await pool.query(
            `SELECT id, name, message, attendance_status, number_of_guests, created_at
       FROM rsvps ORDER BY created_at DESC`,
        );
        return { success: true, data: res.rows };
    }

    // GET /api/envelopes → tabel digital_envelopes
    async getEnvelopes() {
        const res = await pool.query(
            `SELECT id, sender_name, amount, message, payment_method, withdrawal_status, created_at
       FROM digital_envelopes ORDER BY created_at DESC`,
        );
        return { success: true, data: res.rows };
    }
}