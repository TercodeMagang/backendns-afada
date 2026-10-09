import { Injectable } from '@nestjs/common';
import { pool } from '../db';

// ✅ Daftar role yang dianggap admin (sama seperti dashboard & invitations)
const ADMIN_ROLES = ['admin utama', 'admin', 'editor', 'marketing', 'viewer'];

@Injectable()
export class DataService {
    // ✅ Helper: apakah peminta data adalah admin?
    private async isAdmin(requesterId: number): Promise<boolean> {
        const r = await pool.query('SELECT role FROM users WHERE id = $1', [requesterId]);
        const role = r.rows[0]?.role ?? 'Pengguna';
        return ADMIN_ROLES.includes(String(role).toLowerCase());
    }

    // GET /api/guests (?user_id=X → non-admin hanya tamu miliknya)
    async getGuests(requesterId?: number) {
        let sql = `SELECT id, name, whatsapp, table_number, seat_number, category,
              check_in_status, check_in_time, rsvp_status, created_at
       FROM guests`;
        const params: any[] = [];
        if (requesterId && !(await this.isAdmin(requesterId))) {
            sql += ' WHERE invitation_id IN (SELECT id FROM invitations WHERE user_id = $1) OR user_id = $1';
            params.push(requesterId);
        }
        sql += ' ORDER BY id';
        const res = await pool.query(sql, params);
        return { success: true, data: res.rows };
    }

    // ✅ LOGIKA TAMBAH TAMU (sekalian menyimpan pemilik user_id)
    async createGuest(dto: any) {
        const res = await pool.query(
            `INSERT INTO guests (name, whatsapp, table_number, invitation_id, user_id, rsvp_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                dto.name,
                dto.whatsapp || null,
                dto.table_number || null,
                dto.invitation_id || null,
                dto.user_id ?? null,
                dto.rsvp_status || 'Masih Ragu',
            ],
        );
        return { success: true, data: res.rows[0] };
    }

    // ✅ LOGIKA EDIT TAMU
    async updateGuest(id: number, dto: any) {
        const exist = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
        if (exist.rows.length === 0) return { success: false, message: 'Tamu tidak ditemukan' };
        const old = exist.rows[0];

        const res = await pool.query(
            `UPDATE guests 
       SET name = $1, whatsapp = $2, table_number = $3, rsvp_status = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
            [
                dto.name ?? old.name,
                dto.whatsapp !== undefined ? dto.whatsapp : old.whatsapp,
                dto.table_number !== undefined ? dto.table_number : old.table_number,
                dto.rsvp_status ?? old.rsvp_status,
                id
            ]
        );
        return { success: true, data: res.rows[0] };
    }

    // ✅ LOGIKA HAPUS TAMU
    async deleteGuest(id: number) {
        const res = await pool.query('DELETE FROM guests WHERE id = $1 RETURNING id', [id]);
        if (res.rows.length === 0) return { success: false, message: 'Tamu tidak ditemukan' };
        return { success: true };
    }

    // GET /api/rsvps (?user_id=X → non-admin hanya RSVP milik undangannya)
    async getRsvps(requesterId?: number) {
        let sql = `SELECT id, invitation_id, name, message, attendance_status, number_of_guests, created_at
       FROM rsvps`;
        const params: any[] = [];
        if (requesterId && !(await this.isAdmin(requesterId))) {
            sql += ' WHERE invitation_id IN (SELECT id FROM invitations WHERE user_id = $1)';
            params.push(requesterId);
        }
        sql += ' ORDER BY created_at DESC';
        const res = await pool.query(sql, params);
        return { success: true, data: res.rows };
    }

    // ✅ BARU: simpan RSVP tamu dari halaman undangan publik
    async createRsvp(dto: any) {
        if (!dto.name || String(dto.name).trim().length < 2) {
            return { success: false, message: 'Nama wajib diisi!' };
        }
        const res = await pool.query(
            `INSERT INTO rsvps (invitation_id, guest_id, name, message, attendance_status, number_of_guests, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                dto.invitation_id ?? null,
                dto.guest_id ?? null,
                dto.name,
                dto.message ?? null,
                dto.attendance_status ?? 'Masih Ragu',
                dto.number_of_guests ?? 1,
                dto.is_anonymous ?? false,
            ],
        );
        return { success: true, data: res.rows[0] };
    }

    // GET /api/envelopes (?user_id=X → non-admin hanya amplop milik undangannya)
    async getEnvelopes(requesterId?: number) {
        let sql = `SELECT id, sender_name, amount, message, payment_method, withdrawal_status, created_at
       FROM digital_envelopes`;
        const params: any[] = [];
        if (requesterId && !(await this.isAdmin(requesterId))) {
            sql += ' WHERE invitation_id IN (SELECT id FROM invitations WHERE user_id = $1)';
            params.push(requesterId);
        }
        sql += ' ORDER BY created_at DESC';
        const res = await pool.query(sql, params);
        return { success: true, data: res.rows };
    }

    // ✅ BARU: simpan amplop digital dari halaman publik (tertaut ke undangan)
    async createEnvelope(dto: any) {
        if (!dto.sender_name || String(dto.sender_name).trim().length < 2) {
            return { success: false, message: 'Nama pengirim wajib diisi!' };
        }
        const amount = Number(dto.amount);
        if (!amount || amount <= 0) {
            return { success: false, message: 'Nominal amplop tidak valid!' };
        }
        const res = await pool.query(
            `INSERT INTO digital_envelopes (invitation_id, sender_name, amount, message, withdrawal_status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [dto.invitation_id ?? null, dto.sender_name, amount, dto.message ?? null, dto.withdrawal_status ?? 'Belum Ditarik'],
        );
        return { success: true, data: res.rows[0] };
    }

    // ✅ GET /api/transactions (?user_id=X → non-admin hanya pembeliannya sendiri)
    async getTransactions(requesterId?: number) {
        let sql = `SELECT id, invoice_number, customer_name, customer_email, customer_phone,
              package_name, payment_method, payment_gateway,
              amount, admin_fee, total_amount, status,
              payment_date, expired_at, created_at
       FROM transactions`;
        const params: any[] = [];
        if (requesterId && !(await this.isAdmin(requesterId))) {
            sql += ' WHERE user_id = $1';
            params.push(requesterId);
        }
        sql += ' ORDER BY created_at DESC';
        const res = await pool.query(sql, params);
        return { success: true, data: res.rows };
    }

    // ✅ BARU: catat transaksi pembayaran dari checkout frontend
    async createTransaction(dto: any) {
        const res = await pool.query(
            `INSERT INTO transactions
         (invoice_number, invitation_id, user_id, package_id, package_name,
          customer_name, customer_email, customer_phone,
          payment_method, payment_gateway, amount, admin_fee, total_amount,
          status, payment_date, expired_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
            [
                dto.invoice_number,
                dto.invitation_id ?? null,
                dto.user_id ?? null,
                dto.package_id ?? null,
                dto.package_name ?? null,
                dto.customer_name ?? null,
                dto.customer_email ?? null,
                dto.customer_phone ?? null,
                dto.payment_method ?? null,
                dto.payment_gateway ?? null,
                dto.amount ?? 0,
                dto.admin_fee ?? 0,
                dto.total_amount ?? dto.amount ?? 0,
                dto.status ?? 'Pending',
                dto.payment_date ?? null,
                dto.expired_at ?? null,
            ],
        );
        return { success: true, data: res.rows[0] };
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