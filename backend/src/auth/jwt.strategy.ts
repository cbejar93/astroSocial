// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy }                         from '@nestjs/passport';
import { ExtractJwt, Strategy }                     from 'passport-jwt';
import { ConfigService }                            from '@nestjs/config';
import { UsersService }                             from '../users/users.service';

export interface JwtPayload {
  sub:   string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private logger: Logger;

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // local logger (doesn't use `this`)
    const logger = new Logger(JwtStrategy.name);

    // grab & validate SECRET before super()
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      logger.error('Missing JWT_SECRET in environment');
      throw new Error('Missing JWT_SECRET in environment');
    }

    // only now call super()
    super({
      jwtFromRequest:  ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:     secret,
    });

    this.logger = logger;
  }

  async validate(payload: JwtPayload) {
 
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found during JWT validation');
      }
      return {
        sub:             user.id,
        email:           user.email,
        username:        user.username,
        avatarUrl:       user.avatarUrl,
        profileComplete: user.profileComplete,
      };
    } catch (err: any) {
      // only log here (this.logger is now initialized)
      this.logger.error(
        `JWT validation failed for ${payload.sub}: ${err.message}`,
        err.stack,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
