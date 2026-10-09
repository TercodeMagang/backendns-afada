import { Injectable } from '@nestjs/common';
import { pool } from '../db';

// ✅ Daftar role yang dianggap admin (sama seperti modul lain)
const ADMIN_ROLES = ['admin utama', 'admin', 'editor', 'marketing', 'viewer'];

@Injectable()
export class DashboardService {
    private async isAdmin(id: number): Promise<boolean> {
        const r = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        const role = r.rows[0]?.role ?? 'Pengguna';
        return ADMIN_ROLES.includes(String(role).toLowerCase());
    }

    async getSummary(requesterId?: number) {
        try {
            const filterByUser = !!requesterId && !(await this.isAdmin(requesterId));
            const scope = filterByUser ? 'user_id = $1' : 'TRUE';
            const scopeParams: any[] = filterByUser ? [requesterId] : [];

            // Total kunjungan dari undangan dalam cakupan
            const vis = await pool.query(`SELECT COALESCE(SUM(visits), 0) AS total FROM invitations WHERE ${scope}`, scopeParams);
            const invIds = await pool.query(`SELECT id FROM invitations WHERE ${scope}`, scopeParams);
            const ids: number[] = invIds.rows.map(r => r.id);

            let totalGuests = 0, totalRsvp = 0, totalEnvelope = 0, recentRsvps: any[] = [];
            if (!filterByUser) {
                // Admin / tanpa peminta: hitung semua (termasuk data yatim)
                totalGuests = (await pool.query(`SELECT COUNT(*)::int AS c FROM guests`)).rows[0]?.c ?? 0;
                totalRsvp = (await pool.query(`SELECT COUNT(*)::int AS c FROM rsvps`)).rows[0]?.c ?? 0;
                totalEnvelope = Number((await pool.query(`SELECT COALESCE(SUM(amount), 0) AS s FROM digital_envelopes`)).rows[0]?.s ?? 0);
                recentRsvps = (await pool.query(`SELECT * FROM rsvps ORDER BY created_at DESC LIMIT 5`)).rows;
            } else if (ids.length > 0) {
                totalGuests = (await pool.query(`SELECT COUNT(*)::int AS c FROM guests WHERE invitation_id = ANY($1::int[]) OR user_id = $2`, [ids, requesterId])).rows[0]?.c ?? 0;
                totalRsvp = (await pool.query(`SELECT COUNT(*)::int AS c FROM rsvps WHERE invitation_id = ANY($1::int[])`, [ids])).rows[0]?.c ?? 0;
                totalEnvelope = Number((await pool.query(`SELECT COALESCE(SUM(amount), 0) AS s FROM digital_envelopes WHERE invitation_id = ANY($1::int[])`, [ids])).rows[0]?.s ?? 0);
                recentRsvps = (await pool.query(`SELECT * FROM rsvps WHERE invitation_id = ANY($1::int[]) ORDER BY created_at DESC LIMIT 5`, [ids])).rows;
            }

            return {
                success: true,
                data: {
                    totalVisits: Number(vis.rows[0]?.total ?? 0),
                    totalGuests,
                    totalRsvp,
                    totalEnvelope,
                    recentRsvps,
                },
            };
        } catch (error) {
            console.error('Error fetching summary:', error);
            return { success: false, message: 'Error fetching summary' };
        }
    }
}