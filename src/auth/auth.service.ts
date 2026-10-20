import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { pool } from '../db';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// ✅ Aturan durasi paket (bulan); Premium = null = selamanya
const PACKAGE_MONTHS: Record<string, number | null> = {
    Basic: 6,
    Standard: 12,
    Premium: null,
};

@Injectable()
export class AuthService {
    // ✅ Pembersih otomatis: hapus akun 'pending' (belum bayar) yang berumur > 24 jam
    constructor() {
        setInterval(async () => {
            try {
                const res = await pool.query(
                    `DELETE FROM users
                      WHERE status = 'pending'
                        AND created_at < NOW() - INTERVAL '24 hours'
                      RETURNING email`,
                );
                if (res.rowCount && res.rowCount > 0) {
                    console.log(`🧹 Cleanup: ${res.rowCount} akun pending belum bayar dihapus.`);
                }
            } catch (e) {
                console.error('Cleanup pending error:', e);
            }
        }, 60 * 60 * 1000); // tiap 1 jam
    }

    // POST /api/auth/register — akun baru berstatus 'pending' (belum terkonfirmasi)
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
                `INSERT INTO users (name, email, password_hash, role, status)
                 VALUES ($1, $2, $3, $4, 'pending')
                 RETURNING id, name, email, role, status`,
                [name, email.toLowerCase(), hash, 'Pengguna'],
            );
            return { success: true, message: 'Registrasi berhasil!', user: result.rows[0] };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error register:', error);
            throw new HttpException({ success: false, message: 'Error saat registrasi' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // POST /api/auth/login — sekarang ikut mengirim status & paket
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
                user: {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    role: row.role,
                    status: row.status ?? 'active',
                    package_name: row.package_name ?? null,
                    package_valid_until: row.package_valid_until ?? null,
                },
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error login:', error);
            throw new HttpException({ success: false, message: 'Error saat login' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ✅ POST /api/auth/confirm-payment — konfirmasi akun + isi paket + terbitkan kode sekali pakai
    async confirmPayment(body: { email: string; package_name?: string }) {
        try {
            const email = (body.email || '').toLowerCase();
            const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (res.rows.length === 0) {
                throw new HttpException({ success: false, message: 'Akun tidak ditemukan' }, HttpStatus.NOT_FOUND);
            }
            const user = res.rows[0];
            const pkg = body.package_name ?? user.package_name ?? 'Standard';
            const months = PACKAGE_MONTHS[pkg] !== undefined ? PACKAGE_MONTHS[pkg] : 12;

            // ✅ Perpanjangan: dasar hitungan = mana yang lebih akhir antara sekarang / masa aktif lama
            const now = new Date();
            const oldUntil = user.package_valid_until ? new Date(user.package_valid_until) : null;
            const base = oldUntil && oldUntil > now ? oldUntil : now;
            let validUntil: string | null = null;
            if (months !== null) {
                const d = new Date(base);
                d.setMonth(d.getMonth() + months);
                validUntil = d.toISOString().slice(0, 10);
            }

            const code = crypto.randomBytes(24).toString('hex');
            const upd = await pool.query(
                `UPDATE users
                    SET status = 'active',
                        package_name = $1,
                        package_valid_until = $2,
                        login_code = $3,
                        updated_at = NOW()
                  WHERE id = $4
                  RETURNING id, name, email, role, status, package_name, package_valid_until`,
                [pkg, validUntil, code, user.id],
            );
            return {
                success: true,
                user: upd.rows[0],
                login_code: code,
                old_valid_until: user.package_valid_until ?? null,
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error confirm-payment:', error);
            throw new HttpException({ success: false, message: 'Error konfirmasi pembayaran' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ✅ POST /api/auth/code-login — login sekali pakai lewat kode (dari redirect pembayaran)
    async codeLogin(body: { code: string }) {
        try {
            const res = await pool.query('SELECT * FROM users WHERE login_code = $1', [body.code || '']);
            if (res.rows.length === 0) {
                throw new HttpException({ success: false, message: 'Kode tidak valid atau sudah dipakai' }, HttpStatus.UNAUTHORIZED);
            }
            const row = res.rows[0];
            await pool.query('UPDATE users SET login_code = NULL WHERE id = $1', [row.id]);
            return {
                success: true,
                user: { id: row.id, name: row.name, email: row.email, role: row.role, status: row.status ?? 'active' },
            };
        } catch (error: any) {
            if (error instanceof HttpException) throw error;
            console.error('Error code-login:', error);
            throw new HttpException({ success: false, message: 'Error login kode' }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}