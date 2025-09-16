import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

export interface GoogleUserPayload {
  sub:   string;
  email: string;
  name?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);


  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientID) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientSecret) {
      throw new Error('GOOGLE_CLIENT_SECRET is not configured');
    }

    const frontendHost = configService.get<string>('FRONTEND_URL');
    const backendHost = configService.get<string>('BACKEND_URL');
    const callbackBase = frontendHost ?? backendHost;

    if (!callbackBase) {
      throw new Error(
        'Neither FRONTEND_URL nor BACKEND_URL is configured for Google OAuth callback',
      );
    }

    const usingBackendFallback = !frontendHost && !!backendHost;

    super({
      clientID,
      clientSecret,
      callbackURL: `${callbackBase}/api/auth/google/redirect`,
      scope: ['email', 'profile'],
    });

    if (usingBackendFallback) {
      this.logger.warn(
        'FRONTEND_URL is not configured; falling back to BACKEND_URL for Google OAuth callback URL.',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: GoogleUserPayload) => void,
  ) {
    this.logger.log(`Google profile received: ${profile.id}`);

    const emails = profile.emails as { value: string }[] | undefined;
    const email  = emails?.[0]?.value;
    if (!email) {
      this.logger.error('No email found in Google profile');
      return done(new UnauthorizedException('No email in Google profile'));
    }

    const user: GoogleUserPayload = {
      sub:   profile.id,
      email: email,
      name:  profile.displayName,  // might be undefined, that’s okay
    };

    return done(null, user);
  }
}
