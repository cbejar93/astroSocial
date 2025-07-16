import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy }   from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService }        from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID:      process.env.GOOGLE_CLIENT_ID,
      clientSecret:  process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:   `${process.env.BACKEND_URL}/api/auth/google/redirect`,
      scope:         ['email','profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(`Google profile received: ${profile.id}`);
    try {
      // upsert the user & get a JWT
      const jwt = await this.authService.validateOAuthLogin(
        profile.id,
        profile.emails[0].value,
        profile.displayName,
      );
      done(null, { jwt });
    } catch (err) {
      done(err, false);
    }
  }
}