
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // =====================================================
  // LOGIN
  // POST /auth/login
  // =====================================================

  async login(
    email: string,
    password: string,
  ) {
    const user =
      await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    const passwordMatched =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      accessToken,

      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  // =====================================================
  // FORGOT PASSWORD
  // POST /auth/forgot-password
  // =====================================================

  async forgotPassword(
    email: string,
  ): Promise<{
    message: string;
    token?: string;
  }> {
    const user =
      await this.usersService.findByEmail(email);

    /*
     * Security:
     * User exist karta hai ya nahi,
     * frontend ko directly nahi batayenge.
     */
    if (!user) {
      return {
        message:
          'If the email exists, a password reset link has been generated.',
      };
    }

    /*
     * Crypto module import.
     */
    const crypto =
      await import('crypto');

    /*
     * Secure random reset token.
     */
    const token =
      crypto.randomBytes(32).toString('hex');

    /*
     * Token 15 minutes ke liye valid rahega.
     */
    const expiresAt =
      new Date(
        Date.now() +
          15 * 60 * 1000,
      );

    /*
     * Token database mein save.
     */
    await this.usersService.saveResetToken(
      user,
      token,
      expiresAt,
    );

    /*
     * Development/testing ke liye
     * terminal mein token show karenge.
     *
     * Production mein yahan email
     * reset link bhejna hoga.
     */
    console.log(
      'PASSWORD RESET TOKEN:',
      token,
    );

    /*
     * Development/testing ke liye
     * frontend ko token return kar rahe hain.
     */
    return {
      message:
        'Password reset token generated successfully.',
      token,
    };
  }

  // =====================================================
  // RESET PASSWORD
  // POST /auth/reset-password
  // =====================================================

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{
    message: string;
  }> {
    /*
     * Token find karega aur
     * expiry bhi check karega.
     */
    const user =
      await this.usersService.findByResetToken(
        token,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired reset token',
      );
    }

    /*
     * New password ko bcrypt se hash
     * karke database mein save karega.
     */
    await this.usersService.updatePassword(
      user,
      newPassword,
    );

    /*
     * updatePassword() ke andar
     * reset token invalidate ho jayega.
     */

    return {
      message:
        'Password reset successful.',
    };
  }
}

