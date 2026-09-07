import { Injectable } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class DashboardService {
    // GET /api/dashboard/summary → semua angka untuk kartu statistik dashboard
    async getSummary() {
        const [visits, guests, rsvps, envelopes, recentRsvp] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(visits), 0) AS total FROM invitations`),
            pool.query(`SELECT COUNT(*) AS total FROM guests`),
            pool.query(`SELECT COUNT(*) AS total FROM rsvps`),
            pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM digital_envelopes`),
            pool.query(
                `SELECT name, attendance_status, created_at
         FROM rsvps ORDER BY created_at DESC LIMIT 5`,
            ),
        ]);

        return {
            success: true,
            data: {
                totalVisits: Number(visits.rows[0].total),
                totalGuests: Number(guests.rows[0].total),
                totalRsvp: Number(rsvps.rows[0].total),
                totalEnvelope: Number(envelopes.rows[0].total),
                rsvpRecent: recentRsvp.rows,
            },
        };
    }
}