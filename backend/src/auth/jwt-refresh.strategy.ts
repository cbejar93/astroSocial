// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt.strategy'; // or wherever you keep that interface
import type { Request } from 'express';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('Missing JWT_REFRESH_SECRET in environment');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: RequestWithCookies): string | null => req.cookies['jid'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // exactly the same logic as your access‐token strategy:
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      this.logger.error(
        `Refresh token invalid – user ${payload.sub} not found`,
      );
      throw new UnauthorizedException('User not found');
    }
    return {
      sub: user.id,
      email: payload.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      profileComplete: user.profileComplete,
      role: user.role,
    };
  }
}
