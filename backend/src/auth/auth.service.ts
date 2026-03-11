import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { encryptEmail, hashEmail } from '../utils/crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private clean(s: string) {
    return s.replace(/\u0000/g, '');
  }

  private describeProvider(provider: string) {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'supabase':
        return 'email/password';
      default:
        return provider;
    }
  }

  private throwLinkedAccountConflict(existingProvider: string) {
    const providerLabel = this.describeProvider(existingProvider);
    throw new ConflictException(
      `An account with this email already exists via ${providerLabel}. Please continue with ${providerLabel} instead.`,
    );
  }

  private isEmailHashConstraint(error: Prisma.PrismaClientKnownRequestError) {
    if (error.code !== 'P2002') return false;
    const target = error.meta?.target;
    if (!target) return false;
    return Array.isArray(target) ? target.includes('emailHash') : target === 'emailHash';
  }

  /**
   * Find or create the user, then return both
   * an accessToken (short‑lived) and refreshToken (long‑lived).
   */
  async validateOAuthLogin(
    providerId: string,
    email:      string,
    name:       string,
    provider: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
  
    const cleanEmail      = this.clean(email);
    const cleanName       = this.clean(name);
    const cleanProviderId = this.clean(providerId);

    

    // upsert user in your DB
    const emailEncrypted = encryptEmail(cleanEmail);
    const emailHash      = hashEmail(cleanEmail);

    const conflictingUser = await this.prisma.user.findUnique({ where: { emailHash } });

    if (
      conflictingUser &&
      (conflictingUser.provider !== provider || conflictingUser.providerId !== cleanProviderId)
    ) {
      this.throwLinkedAccountConflict(conflictingUser.provider);
    }

    let user;

    try {
      user = await this.prisma.user.upsert({
        where:  { provider_providerId: { provider, providerId: cleanProviderId } },
        create: {
          emailEncrypted: emailEncrypted,
          emailHash:      emailHash,
          name:           cleanName,
          provider,
          providerId:     cleanProviderId,
          lastLoginAt:    new Date(),
        },
        update: {
          name: cleanName,
          emailEncrypted: emailEncrypted,
          emailHash: emailHash,
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && this.isEmailHashConstraint(error)) {
        if (conflictingUser) {
          this.throwLinkedAccountConflict(conflictingUser.provider);
        }
        throw new ConflictException(
          'An account with this email already exists via another sign-in method. Please continue with your existing login.',
        );
      }
      throw error;
    }

    const payload = { sub: user.id, email: cleanEmail };

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

    return { accessToken, refreshToken };
  }
}
