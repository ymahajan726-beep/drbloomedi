
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import type { Request } from 'express';

import { UsersService } from '../services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromExtractors([
          (request: Request) => {
            return (
              request?.cookies?.accessToken ||
              null
            );
          },
        ]),

      ignoreExpiration: false,

      secretOrKey:
        process.env.JWT_SECRET ||
        'drbloomedi-development-secret',
    });
  }

  async validate(
    payload: {
      sub: number;
      email: string;
      role: string;
    },
  ) {
    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'User is not active',
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}

