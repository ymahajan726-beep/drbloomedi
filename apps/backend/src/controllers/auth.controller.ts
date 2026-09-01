
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
  Response,
} from 'express';

import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  // =====================================================
  // LOGIN
  // POST /auth/login
  // =====================================================

  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },

    @Res({ passthrough: true })
    response: Response,
  ) {
    const result =
      await this.authService.login(
        body.email,
        body.password,
      );

    response.cookie(
      'accessToken',
      result.accessToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge:
          24 * 60 * 60 * 1000,
      },
    );

    return {
      user: result.user,
    };
  }

  // =====================================================
  // LOGOUT
  // POST /auth/logout
  // =====================================================

  @Post('logout')
  logout(
    @Res({ passthrough: true })
    response: Response,
  ) {
    response.clearCookie(
      'accessToken',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      },
    );

    return {
      message: 'Logout successful',
    };
  }

  // =====================================================
  // CURRENT USER
  // GET /auth/me
  // =====================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(
    @Req() request: Request,
  ) {
    return {
      user: request.user,
    };
  }

  // =====================================================
  // FORGOT PASSWORD
  // POST /auth/forgot-password
  // =====================================================

  @Post('forgot-password')
  async forgotPassword(
    @Body()
    body: {
      email: string;
    },
  ) {
    return this.authService.forgotPassword(
      body.email,
    );
  }

  // =====================================================
  // RESET PASSWORD
  // POST /auth/reset-password
  // =====================================================

  @Post('reset-password')
  async resetPassword(
    @Body()
    body: {
      token: string;
      newPassword: string;
    },
  ) {
    return this.authService.resetPassword(
      body.token,
      body.newPassword,
    );
  }
}

