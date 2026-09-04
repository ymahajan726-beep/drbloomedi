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
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
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
      user,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    // 6-digit numeric reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Token valid for 15 minutes
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
      token: resetToken, // Directly returned for instant local testing
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

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPass, salt);

    // Clear reset token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }
}