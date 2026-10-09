import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class DomainsService {
    // GET /api/domains
    async getDomains() {
        const res = await pool.query(
            `SELECT d.*, u.name AS user_name, u.email AS user_email
       FROM custom_domains d
       LEFT JOIN users u ON u.id = d.user_id
       ORDER BY d.id DESC`,
        );
        return { success: true, data: res.rows };
    }

    // POST /api/domains
    async createDomain(dto: { user_id?: number; invitation_id?: number; domain_name: string; subdomain?: string }) {
        const res = await pool.query(
            `INSERT INTO custom_domains (user_id, invitation_id, domain_name, subdomain, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
            [dto.user_id ?? null, dto.invitation_id ?? null, dto.domain_name, dto.subdomain ?? null],
        );
        return { success: true, data: res.rows[0] };
    }

    // PUT /api/domains/:id (ubah status / verifikasi)
    async updateDomain(id: number, dto: any) {
        const exist = await pool.query('SELECT * FROM custom_domains WHERE id = $1', [id]);
        if (exist.rows.length === 0) throw new NotFoundException('Domain tidak ditemukan');
        const old = exist.rows[0];
        const res = await pool.query(
            `UPDATE custom_domains
         SET status = $1,
             dns_verified = $2,
             ssl_enabled = $3,
             ssl_status = $4,
             is_primary = $5,
             updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
            [
                dto.status ?? old.status,
                dto.dns_verified ?? old.dns_verified,
                dto.ssl_enabled ?? old.ssl_enabled,
                dto.ssl_status ?? old.ssl_status,
                dto.is_primary ?? old.is_primary,
                id,
            ],
        );
        return { success: true, data: res.rows[0] };
    }

    // DELETE /api/domains/:id
    async deleteDomain(id: number) {
        const res = await pool.query('DELETE FROM custom_domains WHERE id = $1 RETURNING id', [id]);
        if (res.rows.length === 0) throw new NotFoundException('Domain tidak ditemukan');
        return { success: true };
    }
}