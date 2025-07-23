import { Controller, Get, Redirect, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard }                      from '@nestjs/passport';
import type { Request as ExpressRequest, Response as ExpressResponse, } from 'express';
import { AuthService } from './auth.service';


interface AuthRequest extends ExpressRequest {
    user: {
      name: string;
      sub: string;
      email: string
      // add other fields you put on req.user if you need them
    };
  }

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @Redirect() // default 302
  async googleAuthRedirect(@Req() req: AuthRequest, @Res({ passthrough: true }) res: ExpressResponse) {

    let url = '';
    console.log('before the call');
    console.log(req.user.sub)
    console.log(req.user.name);
    console.log('===----====----===-')
    
        // 1) Exchange the Google profile for both tokens
        const { accessToken, refreshToken } =
        await this.authService.validateOAuthLogin(
          req.user.sub,
          req.user.email,
          // if you need name, you can pull it from req.user as well
         req.user.name
        );

        console.log('does it work out here');
  
    

    if(process.env.NODE_ENV){
         url   += `${process.env.FRONTEND_URL}/auth/success?token=${accessToken}`;

    }else{
      url   += `${process.env.FRONTEND_URL_DEV}/auth/success?token=${accessToken}`;
    }
  
    const isProd = process.env.NODE_ENV === 'production'

      // 2) Set the refresh token as an HttpOnly cookie
      res.cookie('jid', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'lax': 'none',
        domain: isProd ? 'astrosocial.fly.dev' :'localhost',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    
    // const token = req.user.jwt;
    console.log(accessToken);
    console.log(url);
    return { url };
  }
}