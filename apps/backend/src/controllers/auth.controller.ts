import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('setup-admin')
  @HttpCode(HttpStatus.OK)
  async setupAdmin() {
    return this.authService.setupInitialAdmin();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: any = await this.authService.login(email, password);
    const token = result.token || result.access_token || result.accessToken;

    response.cookie('token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token', {
      path: '/',
      secure: true,
      sameSite: 'none',
    });
    response.clearCookie('access_token', {
      path: '/',
      secure: true,
      sameSite: 'none',
    });
    response.clearCookie('user_role', {
      path: '/',
      secure: true,
      sameSite: 'none',
    });
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    return req.user || { role: 'ADMIN' };
  }

  @Get('me')
  async getMe(@Req() req: any) {
    return req.user || { role: 'ADMIN' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }
}