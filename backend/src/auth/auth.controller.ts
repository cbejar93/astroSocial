import { Controller, Get, Redirect, Req, UseGuards } from '@nestjs/common';
import { AuthGuard }                      from '@nestjs/passport';
import type { Request as ExpressRequest } from 'express';


interface AuthRequest extends ExpressRequest {
    user: {
      jwt: string;
      // add other fields you put on req.user if you need them
    };
  }

@Controller('api/auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @Redirect() // default 302
  googleAuthRedirect(@Req() req: AuthRequest) {
    if(process.env.NODE_ENV){
 
        const token = req.user.jwt;
        const url   = `${process.env.FRONTEND_URL}/auth/success?token=${token}`;
        return { url };

    }
    
    const token = req.user.jwt;
    const url   = `${process.env.FRONTEND_URL_DEV}/auth/success?token=${token}`;
    console.log(token);
    console.log(url);
    return { url };
  }
}