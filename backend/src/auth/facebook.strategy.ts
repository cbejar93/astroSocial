import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy }                         from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback }         from 'passport-facebook';
const fPath = process.env.NODE_ENV ? process.env.FRONTEND_URL : process.env.BACKEND_URL ;


export interface FacebookUserPayload {
  providerId: string;
  email:      string;
  name?:      string;
}

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);

  constructor() {
    super({
      clientID:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      callbackURL:  `${fPath}/api/auth/facebook/redirect`,
      profileFields: ['id', 'displayName', 'emails'],
    });
  }

  async validate(
    _accessToken:  string,
    _refreshToken: string,
    profile:       Profile,
    done:          VerifyCallback,
  ): Promise<any> {
    this.logger.log(`Facebook profile received: ${profile.id}`);

    const email = profile.emails?.[0]?.value;
    console.log(profile);
    if (!email) {
      this.logger.error('No email found in Facebook profile');
      return done(new UnauthorizedException('No email in Facebook profile'), false);
    }

    const user: FacebookUserPayload = {
      providerId: profile.id,
      email,
      name:       profile.displayName,
    };

    done(null, user);
  }
}