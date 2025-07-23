import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy }   from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService }        from './auth.service';
const gPath = process.env.NODE_ENV ? process.env.FRONTEND_URL : process.env.BACKEND_URL;

export interface GoogleUserPayload {
  sub:   string;
  email: string;
  name?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);


  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${gPath}/api/auth/google/redirect`,
      scope: ['email', 'profile'],
    });
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