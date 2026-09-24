import { Injectable } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class DataService {
    // GET /api/guests
    async getGuests() {
        const res = await pool.query(
            `SELECT id, name, whatsapp, table_number, seat_number, category,
              check_in_status, check_in_time, rsvp_status, created_at
       FROM guests ORDER BY id`,
        );
        return { success: true, data: res.rows };
    }

    // GET /api/rsvps
    async getRsvps() {
        const res = await pool.query(
            `SELECT id, name, message, attendance_status, number_of_guests, created_at
       FROM rsvps ORDER BY created_at DESC`,
        );
        return { success: true, data: res.rows };
    }

    // GET /api/envelopes
    async getEnvelopes() {
        const res = await pool.query(
            `SELECT id, sender_name, amount, message, payment_method, withdrawal_status, created_at
       FROM digital_envelopes ORDER BY created_at DESC`,
        );
        return { success: true, data: res.rows };
    }

    // ✅ BARU: GET /api/transactions → riwayat transaksi dari tabel transactions
    async getTransactions() {
        const res = await pool.query(
            `SELECT id, invoice_number, customer_name, customer_email, customer_phone,
              package_name, payment_method, payment_gateway,
              amount, admin_fee, total_amount, status,
              payment_date, expired_at, created_at
       FROM transactions
       ORDER BY created_at DESC`,
        );
        return { success: true, data: res.rows };
    }

    // PATCH /api/guests/:id/checkin
    async checkInGuest(id: number) {
        const cek = await pool.query(
            `SELECT id, name, check_in_status FROM guests WHERE id = $1`,
            [id],
        );
        if (cek.rows.length === 0) {
            return { success: false, message: 'Tamu tidak ditemukan' };
        }
        const tamu = cek.rows[0];
        if (tamu.check_in_status === 'Sudah Check-In') {
            return { success: false, message: `${tamu.name} sudah check-in sebelumnya.` };
        }
        const res = await pool.query(
            `UPDATE guests
         SET check_in_status = 'Sudah Check-In',
             check_in_time = NOW(),
             updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, check_in_status, check_in_time`,
            [id],
        );
        return { success: true, message: `${res.rows[0].name} berhasil di-check-in!`, data: res.rows[0] };
    }
}