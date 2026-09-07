import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { pool } from '../db';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    // POST /api/auth/register — simpan akun baru ke tabel users (skema baru)
    async register(body: { name: string; email: string; password: string }) {
        try {
            const { name, email, password } = body;
            if (!name || name.length < 3) {
                throw new HttpException({ success: false, message: 'Nama minimal 3 karakter!' }, HttpStatus.BAD_REQUEST);
            }
            if (!email || !email.includes('@')) {
                throw new HttpException({ success: false, message: 'Email tidak valid!' }, HttpStatus.BAD_REQUEST);
            }
            if (!password || password.length < 6) {
                throw new HttpException({ success: false, message: 'Password minimal 6 karakter!' }, HttpStatus.BAD_REQUEST);
            }

            const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
            if (existing.rows.length > 0) {
                throw new HttpException({ success: false, message: 'Email sudah terdaftar!' }, HttpStatus.CONFLICT);
            }

            const hash = await bcrypt.hash(password, 10);
            const result = await pool.query(
                `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role`,
                [name, email.toLowerCase(), hash, 'Pengguna'],
            );
            return { success: true, message: 'Registrasi berhasil!', user: result.rows[0] };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error register:', error);
            throw new HttpException({ success: false, message: 'Error saat registrasi' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/auth/login — cek ke tabel users (kolom password_hash)
    async login(body: { email: string; password: string }) {
        try {
            const { email, password } = body;
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [(email || '').toLowerCase()]);
            if (result.rows.length === 0) {
                throw new HttpException({ success: false, message: 'Email atau password salah' }, HttpStatus.UNAUTHORIZED);
            }
            const row = result.rows[0];
            const match = await bcrypt.compare(password || '', row.password_hash);
            if (!match) {
                throw new HttpException({ success: false, message: 'Email atau password salah' }, HttpStatus.UNAUTHORIZED);
            }
            return {
                success: true,
                message: 'Login berhasil!',
                user: { id: row.id, name: row.name, email: row.email, role: row.role },
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error login:', error);
            throw new HttpException({ success: false, message: 'Error saat login' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}