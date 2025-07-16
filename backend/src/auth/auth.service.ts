import { Injectable }        from '@nestjs/common';
import { JwtService }        from '@nestjs/jwt';
import { PrismaClient }      from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(private jwtService: JwtService) {}

  /** Find or create the user, then return a signed JWT */
  async validateOAuthLogin(
    providerId: string,
    email:      string,
    name:       string,
  ): Promise<string> {
    const user = await this.prisma.user.upsert({
      where:      { provider_providerId: { provider: 'google', providerId } },
      create:     { email, name, provider: 'google', providerId },
      update:     { name },
    });

    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}