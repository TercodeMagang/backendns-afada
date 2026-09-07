import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}