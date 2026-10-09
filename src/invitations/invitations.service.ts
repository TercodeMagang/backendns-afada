import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { pool } from '../db';

// Helper: map kolom snake_case di DB → camelCase untuk frontend
const mapRow = (row: any) => ({
    id: row.id,
    userId: row.user_id,
    coupleName: row.couple_name,
    theme: row.theme,
    status: row.status,
    visits: row.visits,
    createdAt: row.created_at,
    settings: row.settings ?? null,
});

// ✅ Daftar role yang dianggap admin (sama seperti daftar di dashboard)
const ADMIN_ROLES = ['admin utama', 'admin', 'editor', 'marketing', 'viewer'];

@Injectable()
export class InvitationsService {
    // ✅ Helper: ambil role user dari tabel users
    private async getUserRole(id: number): Promise<string> {
        const r = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
        return r.rows[0]?.role ?? 'Pengguna';
    }

    // ✅ Helper: apakah role ini termasuk admin?
    private isAdminRole(role: string): boolean {
        return ADMIN_ROLES.includes((role || '').toLowerCase());
    }

    // GET /api/invitations (?user_id=X → non-admin hanya melihat miliknya)
    async findAll(requesterId?: number) {
        try {
            let sql = 'SELECT * FROM invitations';
            const params: any[] = [];
            if (requesterId) {
                const role = await this.getUserRole(requesterId);
                if (!this.isAdminRole(role)) {
                    sql += ' WHERE user_id = $1';
                    params.push(requesterId);
                }
            }
            sql += ' ORDER BY id';
            const result = await pool.query(sql, params);
            return { success: true, data: result.rows.map(mapRow) };
        } catch (error) {
            console.error('Error fetching invitations:', error);
            throw new HttpException({ success: false, message: 'Error fetching data' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // GET /api/invitations/:id
    async findOne(id: number) {
        try {
            const result = await pool.query('SELECT * FROM invitations WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                throw new HttpException({ success: false, message: 'Undangan tidak ditemukan' }, HttpStatus.NOT_FOUND);
            }
            return { success: true, data: mapRow(result.rows[0]) };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error fetching invitation:', error);
            throw new HttpException({ success: false, message: 'Error fetching data' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/invitations (sekalian menyimpan user_id pemilik)
    async create(body: { coupleName: string; theme?: string; status?: string; visits?: number; settings?: any; user_id?: number }) {
        try {
            const { coupleName, theme, status, visits, settings, user_id } = body;
            const result = await pool.query(
                'INSERT INTO invitations (couple_name, theme, status, visits, settings, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [coupleName, theme || 'Elegant', status || 'Draft', visits || 0, settings ? JSON.stringify(settings) : null, user_id ?? null],
            );
            return { success: true, message: 'Undangan berhasil dibuat', data: mapRow(result.rows[0]) };
        } catch (error) {
            console.error('Error creating invitation:', error);
            throw new HttpException({ success: false, message: 'Error creating invitation' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /api/invitations/:id
    async update(id: number, body: { coupleName: string; theme: string; status: string; visits: number; settings?: any }) {
        try {
            const { coupleName, theme, status, visits, settings } = body;
            const result = await pool.query(
                'UPDATE invitations SET couple_name = $1, theme = $2, status = $3, visits = $4, settings = $5 WHERE id = $6 RETURNING *',
                [coupleName, theme, status, visits, settings ? JSON.stringify(settings) : null, id],
            );
            if (result.rows.length === 0) {
                throw new HttpException({ success: false, message: 'Undangan tidak ditemukan' }, HttpStatus.NOT_FOUND);
            }
            return { success: true, message: 'Undangan berhasil diupdate', data: mapRow(result.rows[0]) };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error updating invitation:', error);
            throw new HttpException({ success: false, message: 'Error updating invitation' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/invitations/:id
    async remove(id: number) {
        try {
            const result = await pool.query('DELETE FROM invitations WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                throw new HttpException({ success: false, message: 'Undangan tidak ditemukan' }, HttpStatus.NOT_FOUND);
            }
            return { success: true, message: 'Undangan berhasil dihapus' };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error deleting invitation:', error);
            throw new HttpException({ success: false, message: 'Error deleting invitation' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ✅ BARU: naikkan kolom visits sebanyak 1 (aman kalau visits masih null)
    async incrementVisit(id: number) {
        const res = await pool.query(
            `UPDATE invitations SET visits = COALESCE(visits, 0) + 1 WHERE id = $1 RETURNING visits`,
            [id],
        );
        if (res.rows.length === 0) return { success: false, message: 'Undangan tidak ditemukan' };
        return { success: true, visits: res.rows[0].visits };
    }
}