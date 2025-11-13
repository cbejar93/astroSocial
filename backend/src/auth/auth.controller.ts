import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { FacebookAuthGuard } from './facebook.guard';
import { JwtRefreshGuard } from './jwt-refresh-guard';
import { SupabaseAuthDto } from './dto/supabase-auth.dto';

interface AuthRequest extends ExpressRequest {
  user: {
    name: string;
    sub: string;
    email: string;
    providerId: string;
    // add other fields you put on req.user if you need them
  };
}

interface RefreshRequest extends ExpressRequest {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject('SUPABASE_CLIENT') private readonly supabase: SupabaseClient,
  ) {}

  private getRefreshCookieDomain(isProd: boolean): string {
    const fallbackDomain = isProd ? 'astrosocial.fly.dev' : 'localhost';
    return process.env.REFRESH_COOKIE_DOMAIN?.trim() || fallbackDomain;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @Redirect() // default 302
  async googleAuthRedirect(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    let url = '';
    this.logger.log('🔷 Google OAuth callback received');

    // 1) Exchange the Google profile for both tokens
    const { accessToken, refreshToken } =
      await this.authService.validateOAuthLogin(
        req.user.sub,
        req.user.email,
        // if you need name, you can pull it from req.user as well
        req.user.name,
        'google',
      );

    this.logger.debug(
      `Received tokens — accessToken length=${accessToken.length}, refreshToken length=${refreshToken.length}`,
    );

    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      url += `${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`;
    } else {
      url += `${process.env.FRONTEND_URL_DEV}/auth/success?token=${accessToken}`;
    }

    // 2) Set the refresh token as an HttpOnly cookie
    res.cookie('jid', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'none',
      domain: this.getRefreshCookieDomain(isProd),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { url };
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookLogin() {
    this.logger.log('🔷 Initiating Facebook OAuth login flow');
    // passport will redirect to Facebook…
  }

  @Get('facebook/redirect')
  @UseGuards(FacebookAuthGuard)
  async facebookRedirect(@Req() req: AuthRequest, @Res() res: ExpressResponse) {
    this.logger.log('🔷 Facebook OAuth callback received');

    const { accessToken, refreshToken } =
      await this.authService.validateOAuthLogin(
        req.user.providerId,
        req.user.email,
        req.user.name,
        'facebook',
      );
    this.logger.debug(
      `Received tokens — accessToken length=${accessToken.length}, refreshToken length=${refreshToken.length}`,
    );

    const isProd = process.env.NODE_ENV === 'production';
    this.logger.log(
      `▶️ Running in ${isProd ? 'production' : 'development'} mode`,
    );

    // set the refresh-token cookie
    this.logger.log('🍪 Setting refresh-token cookie (jid)');
    res.cookie('jid', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'none',
      domain: this.getRefreshCookieDomain(isProd),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // redirect back to front‑end with the short‑lived token
    const frontendBase = isProd
      ? process.env.FRONTEND_URL!
      : process.env.FRONTEND_URL_DEV!;
    const redirectUrl = `${frontendBase}/auth/success?token=${accessToken}`;
    this.logger.log(`🔀 Redirecting to front‑end: ${redirectUrl}`);
    return res.redirect(redirectUrl);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req: RefreshRequest) {
    const payload = { sub: req.user.sub, email: req.user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
    return { accessToken };
  }

  @Post('supabase')
  @HttpCode(HttpStatus.OK)
  async supabaseAuth(
    @Body() supabaseAuthDto: SupabaseAuthDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken: supabaseAccessToken } = supabaseAuthDto;
    const { data, error } = await this.supabase.auth.getUser(supabaseAccessToken);

    if (error || !data?.user) {
      this.logger.warn(`Supabase authentication failed: ${error?.message ?? 'no user returned'}`);
      throw new ForbiddenException('Invalid Supabase access token');
    }

    const user = data.user;

    if (!user.email_confirmed_at) {
      throw new ForbiddenException('Supabase user email not confirmed');
    }

    const email = user.email ?? user.user_metadata?.email;

    if (!email) {
      throw new ForbiddenException('Supabase user missing email');
    }

    const name = user.user_metadata?.full_name ?? email;

    const { accessToken, refreshToken } = await this.authService.validateOAuthLogin(
      user.id,
      email,
      name,
      'supabase',
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('jid', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'none',
      domain: this.getRefreshCookieDomain(isProd),
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }
}
