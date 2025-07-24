// src/auth/facebook.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard }                    from '@nestjs/passport';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  // This gets passed into passport.authenticate()
  getAuthenticateOptions(context: ExecutionContext) {
    return { scope: ['email', 'public_profile'] };
  }
}