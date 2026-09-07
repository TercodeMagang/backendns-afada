import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { pool } from '../db';

// Helper: map kolom snake_case di DB → camelCase untuk frontend
const mapRow = (row: any) => ({
    id: row.id,
    coupleName: row.couple_name,
    theme: row.theme,
    status: row.status,
    visits: row.visits,
    createdAt: row.created_at,
    settings: row.settings ?? null,
});

@Injectable()
export class InvitationsService {
    // GET /api/invitations
    async findAll() {
        try {
            const result = await pool.query('SELECT * FROM invitations ORDER BY id');
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

    // POST /api/invitations
    async create(body: { coupleName: string; theme?: string; status?: string; visits?: number; settings?: any }) {
        try {
            const { coupleName, theme, status, visits, settings } = body;
            const result = await pool.query(
                'INSERT INTO invitations (couple_name, theme, status, visits, settings) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [coupleName, theme || 'Elegant', status || 'Draft', visits || 0, settings ? JSON.stringify(settings) : null],
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
}