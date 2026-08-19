import {
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(
    @Body()
    body: {
      email: string;
      password: string;
    },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      body.email,
      body.password,
    );

    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
    };
  }

  @Post('logout')
  logout(
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return {
      message: 'Logout successful',
    };
  }
}