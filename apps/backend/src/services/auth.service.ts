import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email: cleanEmail } });

    if (!user) {
      console.log(`[AUTH] User not found: ${cleanEmail}`);
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      console.log(`[AUTH] Password mismatch for: ${cleanEmail}`);
      return null;
    }

    const { password, ...result } = user;
    return result;
  }

  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      token: this.jwtService.sign(payload),
      role: user.role,
      user,
    };
  }

  async setupInitialAdmin() {
    const salt = await bcrypt.genSalt(10);

    const usersToSeed = [
      { email: 'admin@drbloomedi.com', pass: 'Admin@1234', role: 'ADMIN', name: 'System Admin' },
      { email: 'doctor@gmail.com', pass: '11111111', role: 'DOCTOR', name: 'Dr. Sharma' },
      { email: 'rajesh@gmail.com', pass: '22222222', role: 'RECEPTION', name: 'Rajesh Reception' },
    ];

    const results: string[] = [];

    for (const item of usersToSeed) {
      const cleanEmail = item.email.trim().toLowerCase();
      const hashedPassword = await bcrypt.hash(item.pass, salt);

      const existingUser = await this.userRepository.findOne({ where: { email: cleanEmail } });

      if (existingUser) {
        existingUser.password = hashedPassword;
        existingUser.role = item.role as any;
        if ('isActive' in existingUser) {
          (existingUser as any).isActive = true;
        }
        await this.userRepository.save(existingUser);
        results.push(`Updated: ${cleanEmail}`);
      } else {
        const newUser = this.userRepository.create({
          email: cleanEmail,
          password: hashedPassword,
          name: item.name,
          role: item.role as any,
          isActive: true,
        } as any);
        await this.userRepository.save(newUser);
        results.push(`Created: ${cleanEmail}`);
      }
    }

    return {
      status: 'SUCCESS',
      message: 'All accounts seeded directly into Neon DB!',
      details: results,
    };
  }

  async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email: cleanEmail } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = expires;
    await this.userRepository.save(user);

    console.log(`\n=========================================`);
    console.log(`🔑 PASSWORD RESET TOKEN FOR: ${user.email}`);
    console.log(`TOKEN: ${resetToken}`);
    console.log(`EXPIRES AT: ${expires.toLocaleTimeString()}`);
    console.log(`=========================================\n`);

    return {
      success: true,
      message: 'Reset token generated successfully.',
      token: resetToken,
    };
  }

  async resetPassword(token: string, newPass: string) {
    if (!token || !newPass) {
      throw new BadRequestException('Token and new password are required.');
    }

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token.trim() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (!user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPass, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}