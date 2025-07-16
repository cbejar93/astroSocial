import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard }                      from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    const jwt = req.user.jwt as string;
    // redirect back to your front‐end with the token
    return `<!doctype html>
    <script>
      // you might replace this with a proper redirect in production
      window.location.href = "${process.env.FRONTEND_URL}/auth/success?token=${jwt}";
    </script>`;
  }
}