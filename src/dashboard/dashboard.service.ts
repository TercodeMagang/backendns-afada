import { Injectable } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class DashboardService {
    async getSummary() {
        // ✅ Total kunjungan = jumlah visits semua undangan
        const visits = await pool.query(
            `SELECT COALESCE(SUM(visits), 0) AS total FROM invitations`,
        );

        // ✅ Total tamu
        const guests = await pool.query(
            `SELECT COUNT(*) AS total FROM guests`,
        );

        // ✅ Total RSVP masuk
        const rsvps = await pool.query(
            `SELECT COUNT(*) AS total FROM rsvps`,
        );

        // ✅ Total nominal amplop digital
        const envelopes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM digital_envelopes`,
        );

        // ✅ 5 RSVP terbaru (join ke invitations untuk nama pasangan)
        const recentRsvps = await pool.query(
            `SELECT r.name, r.message, r.attendance_status, r.created_at, i.couple_name
       FROM rsvps r
       LEFT JOIN invitations i ON r.invitation_id = i.id
       ORDER BY r.created_at DESC
       LIMIT 5`,
        );

        return {
            success: true,
            data: {
                totalVisits: Number(visits.rows[0].total),
                totalGuests: Number(guests.rows[0].total),
                totalRsvp: Number(rsvps.rows[0].total),
                totalEnvelope: Number(envelopes.rows[0].total),
                recentRsvps: recentRsvps.rows,
            },
        };
    }
}