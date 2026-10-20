import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.register(body);
  }

  // ✅ BARU: konfirmasi akun + isi paket + terbitkan kode sekali pakai (dipanggil saat pembayaran sukses)
  @Post('confirm-payment')
  @HttpCode(HttpStatus.OK)
  confirmPayment(@Body() body: { email: string; package_name?: string }) {
    return this.authService.confirmPayment(body);
  }

  // ✅ BARU: login sekali pakai lewat kode (untuk redirect otomatis ke dashboard 5174)
  @Post('code-login')
  @HttpCode(HttpStatus.OK)
  codeLogin(@Body() body: { code: string }) {
    return this.authService.codeLogin(body);
  }
}