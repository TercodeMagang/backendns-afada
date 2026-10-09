import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class NotificationsService {
    async getNotifications(userId: number) {
        const res = await pool.query(
            `SELECT id, user_id, type, title, message, data, is_read, read_at, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId],
        );
        return { success: true, data: res.rows };
    }

    async markRead(id: number) {
        const res = await pool.query(
            `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 RETURNING *`,
            [id],
        );
        if (res.rows.length === 0) throw new NotFoundException('Notifikasi tidak ditemukan');
        return { success: true, data: res.rows[0] };
    }

    async markAllRead(userId: number) {
        const res = await pool.query(
            `UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE RETURNING id`,
            [userId],
        );
        return { success: true, count: res.rowCount };
    }

    async createNotification(dto: { user_id: number; title: string; message: string; type?: string; data?: any }) {
        const res = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [dto.user_id, dto.type ?? 'system', dto.title, dto.message, dto.data ?? null],
        );
        return { success: true, data: res.rows[0] };
    }
}