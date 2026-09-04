import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../services/users.service';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          let token: string | null = null;
          if (request && request.cookies) {
            token = request.cookies['access_token'] || null;
          }
          if (!token && request?.headers?.authorization) {
            token = request.headers.authorization.replace('Bearer ', '');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: 'drbloomedi_secret_key_2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(String(payload.sub));
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer exists or is deactivated');
    }
    return user;
  }
}