// 1) Define an “optional” guard that never throws on missing/invalid token
import { Injectable } from '@nestjs/common';
import { AuthGuard }  from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // just swallow all errors and return user (or null)
    return user || null;
  }
}