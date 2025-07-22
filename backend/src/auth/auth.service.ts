import { Injectable }        from '@nestjs/common';
import { JwtService }        from '@nestjs/jwt';
import { PrismaClient }      from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(private jwtService: JwtService) {}
  private clean = (s: string) => s.replace(/\u0000/g, '');


  /** Find or create the user, then return a signed JWT */
  async validateOAuthLogin(
    providerId: string,
    email:      string,
    name:       string,
  ): Promise<string> {

    const cleanEmail      = this.clean(email);
    const cleanName       = this.clean(name);
    // const cleanProvider   = this.clean(provider);
    const cleanProviderId = this.clean(providerId);

    console.log(email);
    console.log(name);
    console.log(providerId);

      

    const user = await this.prisma.user.upsert({
      where:      { provider_providerId: { provider: 'google', providerId: cleanProviderId } },
      create:     { email: cleanEmail, name: cleanName, provider: 'google', providerId: cleanProviderId },
      update:     { name: cleanName },
    });

    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}