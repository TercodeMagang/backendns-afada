import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { pool } from '../db';

@Injectable()
export class AccountsService {
    // ── USERS ──
    async getUsers() {
        const res = await pool.query(
            `SELECT id, name, email, phone, role, photo_url, created_at FROM users ORDER BY id`,
        );
        return { success: true, data: res.rows };
    }
    async createUser(dto: any) {
        const hash = await bcrypt.hash(dto.password, 10);
        const res = await pool.query(
            `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
            [dto.name, dto.email, dto.phone ?? null, hash, dto.role ?? 'Pengguna'],
        );
        return { success: true, data: res.rows[0] };
    }
    async updateUser(id: number, dto: any) {
        const exist = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (exist.rows.length === 0) throw new NotFoundException('User tidak ditemukan');
        const old = exist.rows[0];
        const hash = dto.password ? await bcrypt.hash(dto.password, 10) : old.password_hash;
        const res = await pool.query(
            `UPDATE users SET name=$1, email=$2, phone=$3, role=$4, password_hash=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id, name, email, phone, role`,
            [dto.name ?? old.name, dto.email ?? old.email, dto.phone !== undefined ? dto.phone : old.phone, dto.role ?? old.role, hash, id],
        );
        return { success: true, data: res.rows[0] };
    }
    async deleteUser(id: number) {
        const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (res.rows.length === 0) throw new NotFoundException('User tidak ditemukan');
        return { success: true };
    }

    // ── ADMINS ──
    async getAdmins() {
        const res = await pool.query(
            `SELECT id, name, email, role, is_active, photo_url, created_at FROM admins ORDER BY id`,
        );
        return { success: true, data: res.rows };
    }
    async createAdmin(dto: any) {
        const hash = await bcrypt.hash(dto.password, 10);
        const res = await pool.query(
            `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [dto.name, dto.email, hash, dto.role ?? 'Admin'],
        );
        return { success: true, data: res.rows[0] };
    }
    async updateAdmin(id: number, dto: any) {
        const exist = await pool.query('SELECT * FROM admins WHERE id = $1', [id]);
        if (exist.rows.length === 0) throw new NotFoundException('Admin tidak ditemukan');
        const old = exist.rows[0];
        const hash = dto.password ? await bcrypt.hash(dto.password, 10) : old.password_hash;
        const res = await pool.query(
            `UPDATE admins SET name=$1, email=$2, role=$3, password_hash=$4, updated_at=NOW()
       WHERE id=$5 RETURNING id, name, email, role, is_active`,
            [dto.name ?? old.name, dto.email ?? old.email, dto.role ?? old.role, hash, id],
        );
        return { success: true, data: res.rows[0] };
    }
    async deleteAdmin(id: number) {
        const res = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
        if (res.rows.length === 0) throw new NotFoundException('Admin tidak ditemukan');
        return { success: true };
    }
}