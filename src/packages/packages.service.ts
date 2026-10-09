import { Injectable, NotFoundException } from '@nestjs/common';
import { pool } from '../db';

@Injectable()
export class PackagesService {
    // Untuk checkout: hanya paket aktif
    async getPackages() {
        const res = await pool.query(
            `SELECT id, code, name, subtitle, price, original_price, features, is_popular, is_active
       FROM packages WHERE is_active = TRUE ORDER BY price ASC`,
        );
        return { success: true, data: res.rows };
    }

    // Untuk admin: semua paket
    async getAllPackages() {
        const res = await pool.query(`SELECT * FROM packages ORDER BY id`);
        return { success: true, data: res.rows };
    }

    async createPackage(dto: any) {
        const res = await pool.query(
            `INSERT INTO packages (code, name, subtitle, price, original_price, features, is_popular, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [dto.code, dto.name, dto.subtitle ?? null, dto.price, dto.original_price ?? null, JSON.stringify(dto.features ?? []), dto.is_popular ?? false, dto.is_active ?? true],
        );
        return { success: true, data: res.rows[0] };
    }

    async updatePackage(id: number, dto: any) {
        const exist = await pool.query('SELECT * FROM packages WHERE id = $1', [id]);
        if (exist.rows.length === 0) throw new NotFoundException('Paket tidak ditemukan');
        const old = exist.rows[0];

        // ✅ PENTING: features wajib berupa STRING JSON.
        // Kalau tidak diubah, pg akan mengirim array JS sebagai array PostgreSQL → error "invalid input syntax for type json"
        const featuresValue = dto.features
            ? JSON.stringify(dto.features)
            : (typeof old.features === 'string' ? old.features : JSON.stringify(old.features ?? []));

        const res = await pool.query(
            `UPDATE packages
         SET code = $1, name = $2, subtitle = $3, price = $4, original_price = $5,
             features = $6, is_popular = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
            [
                dto.code ?? old.code,
                dto.name ?? old.name,
                dto.subtitle !== undefined ? dto.subtitle : old.subtitle,
                dto.price ?? old.price,
                dto.original_price !== undefined ? dto.original_price : old.original_price,
                featuresValue,
                dto.is_popular ?? old.is_popular,
                dto.is_active ?? old.is_active,
                id,
            ],
        );
        return { success: true, data: res.rows[0] };
    }

    async deletePackage(id: number) {
        const res = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING id', [id]);
        if (res.rows.length === 0) throw new NotFoundException('Paket tidak ditemukan');
        return { success: true };
    }
}