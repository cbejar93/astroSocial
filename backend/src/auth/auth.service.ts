import { Injectable }   from '@nestjs/common';
import { JwtService }   from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  constructor(private readonly jwtService: JwtService) {}

  private clean(s: string) {
    return s.replace(/\u0000/g, '');
  }

  /**
   * Find or create the user, then return both
   * an accessToken (short‑lived) and refreshToken (long‑lived).
   */
  async validateOAuthLogin(
    providerId: string,
    email:      string,
    name:       string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const cleanEmail      = this.clean(email);
    const cleanName       = this.clean(name);
    const cleanProviderId = this.clean(providerId);

    console.log(email);
    console.log(name)
    console.log(providerId);

    // upsert user in your DB
    const user = await this.prisma.user.upsert({
      where:  { provider_providerId: { provider: 'google', providerId: cleanProviderId } },
      create: { email: cleanEmail, name: cleanName, provider: 'google', providerId: cleanProviderId },
      update: { name: cleanName },
    });

    console.log('after call/')

    const payload = { sub: user.id, email: user.email };

    // 1) short‑lived access token (e.g. 15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,           // your access‑token secret
      expiresIn: '15m',
    });

    // 2) long‑lived refresh token (e.g. 7 days)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,   // a second secret for refresh
      expiresIn: '7d',
    });

    console.log('=====')
    console.log(accessToken);
    console.log('=====')

    console.log(refreshToken);
    console.log('=====')

    console.log(user);

    return { accessToken, refreshToken };
  }
}